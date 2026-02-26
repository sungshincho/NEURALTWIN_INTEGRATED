# Agent: pi-fleet

## Role

Manage the Raspberry Pi sniffer fleet — the 8 Pis that capture Wi-Fi RSSI
and publish to MQTT.

## Owned Files

- `neuralsense_pi/sniff_and_send_unified.py` — sniffer (calibration, test, production modes)
- `neuralsense_pi/set_channel.sh` — monitor mode setup script
- `neuralsense_pi/requirements.txt` — Pi-side Python dependencies

## Read-Only Context (do not modify)

- `config.py` — imports MQTT_BROKER_IP, MQTT_BROKER_PORT, MQTT_TOPIC_PREFIX
- `run_live_geometry.py` — understand what the laptop expects from MQTT messages

## Hardware Fleet

| Pi ID | Interface | Tailscale IP                |
|-------|-----------|-----------------------------|
| pi5   | wlan0     | (check `tailscale status`)  |
| pi7   | wlan0     |                             |
| pi8   | wlan0     |                             |
| pi9   | wlan1     |                             |
| pi10  | wlan0     |                             |
| pi11  | wlan1     |                             |
| pi12  | wlan0     |                             |
| pi13  | wlan0     |                             |

All connected via Tailscale VPN. MQTT broker: 100.87.27.7:1883.

## MQTT Message Contract

The sniffer publishes to topic `neuralsense/rssi`:
```json
{"ts": 1740000000.123, "rpi_id": "pi10", "mac": "a8:76:50:e9:28:20", "rssi": -65}
```

- `ts`: Unix epoch float (Pi's local clock)
- `rpi_id`: lowercase Pi identifier
- `mac`: lowercase MAC address (raw or hashed depending on mode)
- `rssi`: signed integer dBm, filtered to [-95, -20]

**Do not change this format** without coordinating with the `algorithm` agent.

## Sniffer Modes

| Mode        | Flag                  | Behavior                          |
|-------------|-----------------------|-----------------------------------|
| Calibration | `--target-mac MAC`    | Publish only the specified MAC    |
| Test        | `--track-macs "m1,m2"`| Publish only listed MACs          |
| Production  | (no filter flags)     | Publish all observed MACs         |
| + Hashing   | `--hash-macs --hash-salt S` | SHA-256 hash MACs before publish |

## Constraints

- **Scapy dependency.** Pi sniffers use Scapy for packet capture. Must run as root.
- **Monitor mode required.** Interface must be set to monitor mode via `set_channel.sh`
  before starting the sniffer.
- **Config import.** `sniff_and_send_unified.py` imports from `config.py` (one level up).
  The `sys.path.insert` at line 26 handles this.
- **RSSI sanity bounds.** [-95, -20] dBm. Values outside are dropped silently.
  Some drivers report unsigned 8-bit (128-255), converted to signed automatically.
- **No changes to MQTT message format** without updating the `algorithm` agent's
  parsing in `run_live_geometry.py`.

## Future Work

- Fleet management script: SSH into all 8 Pis, start/stop sniffers in parallel
- Health monitoring: detect when a Pi stops publishing, alert
- Multi-channel scanning: rotate channels to catch more probe requests
- OTA update: push new sniffer code to all Pis from laptop
