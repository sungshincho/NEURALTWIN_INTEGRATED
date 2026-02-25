import os
import subprocess
import sys
import time

def sh(cmd):
    return subprocess.check_output(cmd, shell=True, text=True).strip()

def list_wlan_ifaces():
    return sorted([n for n in os.listdir("/sys/class/net") if n.startswith("wlan")])

def default_route_iface():
    # interface used for internet/SSH
    try:
        out = sh("ip route show default")
        if " dev " in out:
            return out.split(" dev ")[1].split()[0].strip()
    except Exception:
        return None
    return None

def force_disconnect(iface):
    print("[INFO] Forcing disconnect on", iface)

    # Try NetworkManager (if present)
    try:
        sh("nmcli dev disconnect {}".format(iface))
        print("[OK] Disconnected via NetworkManager")
    except Exception:
        pass

    # Bring interface down (this ALWAYS works)
    sh("sudo ip link set {} down".format(iface))
    time.sleep(1)

def set_monitor(iface):
    print("[INFO] Switching", iface, "to monitor mode")

    # Change type
    sh("sudo iw dev {} set type monitor".format(iface))
    time.sleep(1)

    # Bring back up
    sh("sudo ip link set {} up".format(iface))
    time.sleep(1)

def verify_monitor(iface):
    try:
        out = sh("iwconfig {}".format(iface))
        if "Mode:Monitor" in out:
            print("[OK] VERIFIED: {} is in Monitor mode".format(iface))
            return True
        else:
            print("[ERROR] {} is NOT in Monitor mode".format(iface))
            print(out)
            return False
    except Exception as e:
        print("[ERROR] Could not verify monitor mode:", e)
        return False

def main():
    wlans = list_wlan_ifaces()
    if not wlans:
        print("[ERROR] No wlan interfaces found.")
        sys.exit(1)

    default_iface = default_route_iface()
    print("[INFO] wlan interfaces found:", wlans)
    print("[INFO] internet/ssh uses:", default_iface)

    # Choose interface NOT used for internet if possible
    candidates = [w for w in wlans if w != default_iface]
    if candidates:
        chosen = candidates[0]
    else:
        chosen = wlans[0]
        print("[WARN] Only one wlan interface found. SSH may disconnect.")

    print("[INFO] Selected interface:", chosen)

    force_disconnect(chosen)
    set_monitor(chosen)

    if not verify_monitor(chosen):
        print("\n[FATAL] Failed to enable monitor mode.")
        print("This is usually a driver or hardware limitation.")
        sys.exit(1)

    print("\n=== USE THIS EXACT NAME FOR --iface ===")
    print(chosen)

if __name__ == "__main__":
    main()
