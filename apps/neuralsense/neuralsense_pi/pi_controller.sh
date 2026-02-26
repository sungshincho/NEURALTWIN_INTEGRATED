#!/bin/bash
# pi_controller.sh — Fleet controller for NeuralSense Raspberry Pis
#
# Usage:
#   bash pi_controller.sh monitor [channel]    Set monitor mode on all Pis (default ch 6)
#   bash pi_controller.sh start-cal            Start sniffers in CALIBRATION mode
#   bash pi_controller.sh start-test           Start sniffers in TEST mode
#   bash pi_controller.sh stop                 Stop all sniffers
#   bash pi_controller.sh status               Check which Pis are reachable + sniffer running

# ── Config ──────────────────────────────────────────────────
PI_PASSWORD="raspberry"
CHANNEL="${2:-6}"
CAL_MAC="a8:76:50:e9:28:20"
TRACK_MACS="b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"

PI_IDS=(pi10 pi5 pi7 pi8 pi9 pi11 pi12 pi13)

declare -A PI_SSH
PI_SSH[pi10]="pi@100.87.27.7"
PI_SSH[pi5]="pi@100.123.7.8"
PI_SSH[pi7]="pi@100.111.126.17"
PI_SSH[pi8]="pi@100.116.169.37"
PI_SSH[pi9]="pi@100.65.40.39"
PI_SSH[pi11]="pi@100.90.142.34"
PI_SSH[pi12]="pi@100.96.1.14"
PI_SSH[pi13]="pi@100.73.179.15"

# ── SSH helper ──────────────────────────────────────────────
run_ssh() {
    local target="$1"
    shift
    sshpass -p "$PI_PASSWORD" ssh \
        -o ConnectTimeout=10 \
        -o StrictHostKeyChecking=no \
        -o LogLevel=ERROR \
        "$target" "$@"
}

# ── Detect REALTEK interface ────────────────────────────────
# Runs iwconfig on the Pi, finds which wlanX has Nickname:"<WIFI@REALTEK>"
detect_realtek() {
    local target="$1"
    run_ssh "$target" "iwconfig 2>/dev/null | grep -B1 'WIFI@REALTEK' | head -1 | awk '{print \$1}'"
}

# ── Commands ────────────────────────────────────────────────

cmd_monitor() {
    echo "============================================"
    echo "  Setting monitor mode — channel $CHANNEL"
    echo "============================================"
    echo ""

    local ok=0 fail=0

    for pi in "${PI_IDS[@]}"; do
        local target="${PI_SSH[$pi]}"
        echo "--- $pi ($target) ---"

        local iface
        iface=$(detect_realtek "$target")

        if [ -z "$iface" ]; then
            echo "  FAIL: no REALTEK interface found"
            fail=$((fail + 1))
            echo ""
            continue
        fi

        echo "  REALTEK interface: $iface"
        local output
        output=$(run_ssh "$target" "cd ~/neuralsense_pi && sudo bash set_channel.sh $CHANNEL $iface 2>&1")

        if echo "$output" | grep -q "Mode:Monitor"; then
            echo "  OK: $iface -> Monitor mode, channel $CHANNEL"
            ok=$((ok + 1))
        else
            echo "  FAIL: could not set monitor mode"
            echo "  $output"
            fail=$((fail + 1))
        fi
        echo ""
    done

    echo "============================================"
    echo "  Monitor mode: $ok OK, $fail FAIL"
    echo "============================================"
}

cmd_start_cal() {
    echo "============================================"
    echo "  Starting CALIBRATION sniffers"
    echo "  Target MAC: $CAL_MAC"
    echo "============================================"
    echo ""

    for pi in "${PI_IDS[@]}"; do
        local target="${PI_SSH[$pi]}"
        echo -n "$pi: "

        local iface
        iface=$(detect_realtek "$target")

        if [ -z "$iface" ]; then
            echo "FAIL (no REALTEK interface)"
            continue
        fi

        # Kill any existing sniffer
        run_ssh "$target" "sudo pkill -f sniff_and_send_unified.py 2>/dev/null; sleep 0.5" 2>/dev/null

        # Start calibration sniffer in background
        run_ssh "$target" \
            "cd ~/neuralsense_pi && nohup sudo python3 sniff_and_send_unified.py \
            --rpi-id $pi --iface $iface --target-mac $CAL_MAC \
            > /tmp/sniffer_${pi}.log 2>&1 &"

        echo "OK ($iface, calibration mode)"
    done

    echo ""
    echo "All calibration sniffers started."
    echo "Now run: python calibrate_interactive_geometry.py"
}

cmd_start_test() {
    echo "============================================"
    echo "  Starting TEST sniffers"
    echo "  Track MACs: $TRACK_MACS"
    echo "============================================"
    echo ""

    for pi in "${PI_IDS[@]}"; do
        local target="${PI_SSH[$pi]}"
        echo -n "$pi: "

        local iface
        iface=$(detect_realtek "$target")

        if [ -z "$iface" ]; then
            echo "FAIL (no REALTEK interface)"
            continue
        fi

        # Kill any existing sniffer
        run_ssh "$target" "sudo pkill -f sniff_and_send_unified.py 2>/dev/null; sleep 0.5" 2>/dev/null

        # Start test sniffer in background
        run_ssh "$target" \
            "cd ~/neuralsense_pi && nohup sudo python3 sniff_and_send_unified.py \
            --rpi-id $pi --iface $iface --track-macs \"$TRACK_MACS\" \
            > /tmp/sniffer_${pi}.log 2>&1 &"

        echo "OK ($iface, test mode)"
    done

    echo ""
    echo "All test sniffers started."
    echo "Now run: python run_live_geometry.py"
}

cmd_stop() {
    echo "============================================"
    echo "  Stopping all sniffers"
    echo "============================================"
    echo ""

    for pi in "${PI_IDS[@]}"; do
        local target="${PI_SSH[$pi]}"
        echo -n "$pi: "

        run_ssh "$target" "sudo pkill -f sniff_and_send_unified.py 2>/dev/null"

        if [ $? -eq 0 ]; then
            echo "stopped"
        else
            echo "nothing running"
        fi
    done
}

cmd_status() {
    echo "============================================"
    echo "  Pi Fleet Status"
    echo "============================================"
    echo ""

    printf "%-6s  %-20s  %-8s  %-10s  %s\n" "PI" "SSH" "PING" "IFACE" "SNIFFER"
    printf "%-6s  %-20s  %-8s  %-10s  %s\n" "------" "--------------------" "--------" "----------" "----------"

    for pi in "${PI_IDS[@]}"; do
        local target="${PI_SSH[$pi]}"
        local ip
        ip=$(echo "$target" | cut -d@ -f2)

        # Check reachability
        local reachable="NO"
        if run_ssh "$target" "echo ok" >/dev/null 2>&1; then
            reachable="YES"
        fi

        local iface="-"
        local sniffer="-"

        if [ "$reachable" = "YES" ]; then
            iface=$(detect_realtek "$target" 2>/dev/null)
            [ -z "$iface" ] && iface="NOT FOUND"

            local proc
            proc=$(run_ssh "$target" "pgrep -a -f sniff_and_send_unified.py 2>/dev/null | head -1" 2>/dev/null)
            if [ -n "$proc" ]; then
                if echo "$proc" | grep -q "target-mac"; then
                    sniffer="CALIBRATE"
                elif echo "$proc" | grep -q "track-macs"; then
                    sniffer="TEST"
                else
                    sniffer="PRODUCTION"
                fi
            else
                sniffer="stopped"
            fi
        fi

        printf "%-6s  %-20s  %-8s  %-10s  %s\n" "$pi" "$target" "$reachable" "$iface" "$sniffer"
    done
}

cmd_help() {
    echo "pi_controller.sh — NeuralSense Pi Fleet Controller"
    echo ""
    echo "Usage:"
    echo "  bash pi_controller.sh monitor [channel]   Set monitor mode (default ch 6)"
    echo "  bash pi_controller.sh start-cal            Start calibration sniffers"
    echo "  bash pi_controller.sh start-test           Start test sniffers"
    echo "  bash pi_controller.sh stop                 Stop all sniffers"
    echo "  bash pi_controller.sh status               Check fleet status"
    echo ""
    echo "Typical workflow:"
    echo "  1. bash pi_controller.sh monitor"
    echo "  2. bash pi_controller.sh start-cal"
    echo "     python calibrate_interactive_geometry.py"
    echo "  3. bash pi_controller.sh start-test"
    echo "     python run_live_geometry.py"
    echo "     python accuracy_test_from_zone_assignments.py"
    echo "  4. bash pi_controller.sh stop"
}

# ── Main ────────────────────────────────────────────────────

# Check sshpass is installed
if ! command -v sshpass &>/dev/null; then
    echo "ERROR: sshpass is not installed."
    echo "Install with: sudo apt install sshpass  (Linux)"
    echo "           or: brew install hudochenkov/sshpass/sshpass  (Mac)"
    echo "           or: pacman -S sshpass  (MSYS2/Git Bash)"
    exit 1
fi

case "${1:-help}" in
    monitor)    cmd_monitor ;;
    start-cal)  cmd_start_cal ;;
    start-test) cmd_start_test ;;
    stop)       cmd_stop ;;
    status)     cmd_status ;;
    help|*)     cmd_help ;;
esac
