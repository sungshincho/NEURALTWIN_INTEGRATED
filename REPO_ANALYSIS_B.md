# NeuralSense Repository Analysis

---

## Section 1: Project Structure

### 1. Directory Tree (3-Level Depth)

```
neuralsense/
├── accuracy_test_from_zone_assignments.py
├── calibrate_interactive.py
├── requirements.txt
├── run_live.py
├── run_live_test.py
├── zones.csv
├── zones_original.csv
└── neuralsense_pi/
    ├── requirements.txt
    ├── set_channel.sh
    ├── set_monitor_mode.py
    ├── sniff_and_send.py
    └── sniff_and_send_unified.py
```

### 2. Main Entry Points

| File | Role | Description |
|------|------|-------------|
| `run_live.py` | **Primary runtime** | MQTT subscriber that receives RSSI data, builds live fingerprint vectors, matches against calibration data, and outputs zone assignments / transitions / dwells in real-time. |
| `run_live_test.py` | **Runtime (variant)** | Same logic as `run_live.py` with additional heartbeat logging and disconnect handler. `MIN_SOURCES=6` (vs 8). |
| `calibrate_interactive.py` | **Calibration tool** | Interactive CLI that collects RSSI samples per zone from all Raspberry Pis and saves calibration vectors to `output/calibration.jsonl`. |
| `accuracy_test_from_zone_assignments.py` | **Accuracy tester** | Reads `zone_assignments.jsonl` live, compares predicted zones against user-declared ground truth, and logs per-phone accuracy. |
| `neuralsense_pi/sniff_and_send.py` | **Pi sniffer (basic)** | Runs on each Raspberry Pi. Captures Wi-Fi probe/data frames via Scapy in monitor mode and publishes RSSI per MAC to MQTT. |
| `neuralsense_pi/sniff_and_send_unified.py` | **Pi sniffer (unified)** | Enhanced version with calibration/test/production modes, optional MAC hashing for privacy. |
| `neuralsense_pi/set_monitor_mode.py` | **Pi setup utility** | Automatically selects a wlan interface (avoiding the SSH interface) and switches it to monitor mode. |
| `neuralsense_pi/set_channel.sh` | **Pi setup utility** | Shell script to set a specific Wi-Fi channel on a monitor-mode interface. |

### 3. File & Code Line Counts

**Total files:** 12 (excluding hidden/git files)

| Language | Files | Lines of Code |
|----------|-------|---------------|
| Python   | 7     | 1,242         |
| Shell    | 1     | 10            |
| CSV      | 2     | 147           |
| Text     | 2     | 3             |
| **Total** | **12** | **1,402**   |

#### Per-File Breakdown (Python)

| File | Lines |
|------|-------|
| `run_live_test.py` | 277 |
| `run_live.py` | 210 |
| `calibrate_interactive.py` | 191 |
| `neuralsense_pi/sniff_and_send_unified.py` | 185 |
| `accuracy_test_from_zone_assignments.py` | 179 |
| `neuralsense_pi/sniff_and_send.py` | 107 |
| `neuralsense_pi/set_monitor_mode.py` | 93 |

### 4. Frameworks & Libraries

This project does **not** use any web framework. It is a pure IoT/edge-computing system built on:

- **MQTT messaging** (`paho-mqtt`) -- message bus between Raspberry Pis and laptop
- **Packet capture** (`scapy`) -- Wi-Fi frame sniffing in monitor mode
- **Python standard library** -- all data processing (json, csv, collections, statistics, datetime, etc.)

No `pyproject.toml`, `setup.py`, or `setup.cfg` exists. Dependencies are managed via plain `requirements.txt` files.

### 5. Configuration Files

| File | Purpose |
|------|---------|
| `requirements.txt` | Laptop-side dependencies (paho-mqtt) |
| `neuralsense_pi/requirements.txt` | Raspberry Pi dependencies (paho-mqtt, scapy) |
| `zones.csv` | Zone definitions -- 19 zones with (x, y) grid coordinates |
| `zones_original.csv` | Original zone definitions -- 125 zones with (x, y) grid coordinates |

**Not present:** `.env`, `.env.example`, `setup.py`, `pyproject.toml`, `Dockerfile`, `docker-compose.yml`, `.gitignore`, `Makefile`

---

## Section 2: Dependency Map

### Root `requirements.txt` (Laptop)

```
paho-mqtt==2.1.0
```

### `neuralsense_pi/requirements.txt` (Raspberry Pi)

```
paho-mqtt==2.1.0
scapy==2.6.1
```

### Dependency Classification

#### 1. Web/API Framework
- **None** -- This project does not use any web framework (no Flask, FastAPI, Django, etc.)

#### 2. AI/ML Libraries
- **None** -- Despite the project name "NeuralSense", no ML libraries are used. Zone matching uses a simple average-RSSI-difference algorithm (fingerprinting), not a neural network.

#### 3. Hardware Interface
- **scapy==2.6.1** -- Used on Raspberry Pis for raw Wi-Fi packet capture (802.11 frame sniffing via `Dot11` layer). Requires a Wi-Fi adapter in monitor mode.
- Standard library `subprocess` and `os` are used for network interface management (`iw`, `ip link`, `iwconfig`, `nmcli`).

#### 4. Communication Libraries
- **paho-mqtt==2.1.0** -- MQTT client library used for real-time RSSI data transport between Raspberry Pis (publishers) and the laptop (subscriber). Broker runs on `100.87.27.7:1883` (pi10).

#### 5. Data Processing
- **Standard library only:**
  - `json` -- JSONL file I/O and MQTT message serialization
  - `csv` -- Zone CSV file parsing
  - `collections.defaultdict`, `collections.deque` -- Rolling window buffers
  - `statistics.median` -- Median RSSI calculation per Pi
  - `hashlib` -- SHA-256 MAC hashing for privacy (unified sniffer)

#### 6. Supabase Related
- **None**

#### 7. Utilities
- **Standard library only:**
  - `os`, `sys` -- File I/O, path management, exit handling
  - `time` -- Timestamps, timeouts, heartbeats
  - `datetime` (timezone, timedelta) -- KST (UTC+9) timestamp formatting
  - `argparse` -- CLI argument parsing (Pi sniffers)
  - `queue.Queue` -- Thread-safe RSSI message queue (calibration tool)

#### 8. Development Tools
- **None** -- No pytest, black, flake8, mypy, or any dev tools are configured.

#### 9. Version Conflict Risk

| Package | Pinned Version | Risk | Notes |
|---------|---------------|------|-------|
| `paho-mqtt` | 2.1.0 | **Medium** | v2.x introduced breaking API changes from v1.x (e.g., `Client()` constructor, callback signatures). The code currently uses v1.x-style `Client(client_id=...)` API. If `paho-mqtt` 2.x enforces `CallbackAPIVersion`, the current code may emit deprecation warnings or errors. |
| `scapy` | 2.6.1 | Low | Stable release, no known conflicts. |

---

## Section 3: Environment Variables

### `.env` File

**No `.env` or `.env.example` file exists in this repository.**

### Code Scan for `os.environ` / `os.getenv`

**No usage of `os.environ`, `os.getenv`, or `environ.get` found anywhere in the codebase.**

### Hardcoded Configuration (Acting as Environment Variables)

All configuration is **hardcoded as Python constants** at the top of each file. These values function as what would normally be environment variables:

| Constant | Value | File(s) | Description |
|----------|-------|---------|-------------|
| `MQTT_HOST` | `"100.87.27.7"` | All files | IP address of the MQTT broker (Tailscale address of pi10). |
| `MQTT_PORT` | `1883` | All files | MQTT broker port (default, unencrypted). |
| `MQTT_TOPIC` | `"neuralsense/rssi"` | All files | MQTT topic for RSSI data pub/sub. |
| `CAL_PHONE_MAC` | `"a8:76:50:e9:28:20"` | `calibrate_interactive.py` | MAC address of the calibration phone. |
| `ALL_PIS` | `["pi10", "pi5", "pi7", "pi8", "pi9", "pi11", "pi12", "pi13"]` | `calibrate_interactive.py` | List of all Raspberry Pi node IDs. |
| `TRACK_MACS` | `["b0:54:76:5c:99:d5", "24:24:b7:19:30:0a", "a8:76:50:e9:28:20"]` | `accuracy_test_from_zone_assignments.py` | MAC addresses of phones tracked during accuracy tests. |
| `WINDOW_SEC` | `5` | `run_live.py`, `run_live_test.py` | Rolling time window (seconds) for RSSI aggregation. |
| `MIN_SOURCES` | `8` / `6` | `run_live.py` / `run_live_test.py` | Minimum number of Pis that must report before a zone assignment is attempted. |
| `MATCH_DIFF_DBM` | `7.0` | `run_live.py`, `run_live_test.py` | Maximum average dBm difference to count a calibration vector as a "match". |
| `RSSI_MIN_DBM` | `-95` | `neuralsense_pi/sniff_and_send*.py` | Minimum acceptable RSSI (filters noise). |
| `RSSI_MAX_DBM` | `-20` | `neuralsense_pi/sniff_and_send*.py` | Maximum acceptable RSSI (filters unrealistic values). |
| `MAX_SAMPLES_PER_PI` | `8` | `calibrate_interactive.py` | Number of RSSI samples to collect per Pi during calibration. |
| `SYNC_WINDOW_SEC` | `1.0` | `calibrate_interactive.py` | Time window for synchronizing RSSI readings into a single calibration vector. |
| `MIN_PIS_FOR_VECTOR` | `3` | `calibrate_interactive.py` | Minimum Pis reporting within sync window to form a valid calibration vector. |
| `TEST_DURATION_SEC` | `500` | `accuracy_test_from_zone_assignments.py` | Duration of each accuracy test round (seconds). |
| `OUTLIER_THRESHOLD` | `15` | `calibrate_interactive.py` | Maximum dBm deviation from recent median to accept a sample (outlier rejection). |

> **Note:** Extracting these into a `.env` file or a shared `config.py` is recommended to avoid duplication and enable per-deployment configuration without code changes. Currently, the MQTT broker IP, MAC addresses, and tuning parameters are duplicated across multiple files.

---

## Section 4: Python Dependency Management Details

### 4-1. Package Management Method

#### 1. Package Manager in Use

**pip only (plain `requirements.txt`).**

- Poetry, Pipenv, Conda 등은 사용하지 않음.
- `Pipfile`, `Pipfile.lock`, `poetry.lock`, `pyproject.toml`, `conda.yml`, `environment.yml` 모두 존재하지 않음.
- 패키지 설치는 수동으로 `pip install -r requirements.txt` 실행 방식으로 추정됨.

#### 2. requirements.txt Locations & Contents

| File | Target Environment | Contents |
|------|--------------------|----------|
| `requirements.txt` (root) | Laptop (subscriber/processor) | `paho-mqtt==2.1.0` |
| `neuralsense_pi/requirements.txt` | Raspberry Pi (sniffer) | `paho-mqtt==2.1.0`, `scapy==2.6.1` |

> 두 환경의 requirements가 분리되어 있는 것은 합리적 설계임. Laptop에는 scapy가 불필요하고, Pi에는 scapy가 필수.

#### 3. pyproject.toml

**사용하지 않음.** 프로젝트 루트와 하위 디렉토리 어디에도 `pyproject.toml`이 존재하지 않음.

#### 4. setup.py / setup.cfg

**존재하지 않음.** 이 프로젝트는 패키지로 배포되는 구조가 아니라, 개별 스크립트를 직접 실행하는 방식임.

---

### 4-2. Virtual Environment Setup

#### 1. Virtual Environment Type

**명시적 가상환경 설정 없음.**

- `venv/`, `.venv/`, `env/` 디렉토리 없음.
- `.python-version` (pyenv), `runtime.txt` (Heroku), `.tool-versions` (asdf) 파일 없음.
- Conda `environment.yml` 없음.

사용자가 시스템 Python 또는 수동으로 생성한 가상환경에서 실행하는 것으로 추정됨.

#### 2. Virtual Environment Setup Script

**없음.** `setup.sh`, `install.sh`, `bootstrap.sh` 등의 환경 설정 스크립트가 존재하지 않음.

현재 프로젝트 실행을 위한 추정 절차:

```bash
# Laptop (subscriber)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run_live.py

# Raspberry Pi (sniffer)
python3 -m venv .venv
source .venv/bin/activate
pip install -r neuralsense_pi/requirements.txt
sudo python sniff_and_send_unified.py --rpi-id pi5 --iface wlan1
```

#### 3. Python Version Requirements

**명시적 요구사항 없음.** `python_requires`가 어떤 파일에서도 정의되지 않음.

코드 분석에 기반한 **최소 Python 버전 추정:**

| Feature Used | Minimum Python Version | Location |
|-------------|----------------------|----------|
| `f-string` 미사용 (`str.format()` 사용) | 2.7+ (호환) | All files |
| `statistics.median` | **3.4+** | `run_live.py`, `run_live_test.py` |
| `datetime.timezone` | **3.2+** | All files |
| `os.makedirs(exist_ok=True)` | **3.2+** | Multiple files |
| `nonlocal` keyword | **3.0+** | `run_live_test.py` |
| Type hints (`: str`, `-> ...`) | **3.5+** | `neuralsense_pi/sniff_and_send_unified.py` |

**실제 최소 요구 버전: Python 3.5+** (type hint 사용 기준)

**권장 버전: Python 3.7+** (paho-mqtt 2.x 및 scapy 2.6.x의 공식 지원 범위)

---

### 4-3. Dependency Locking

#### 1. Version Pinning Status

| File | Package | Pinned? | Version Specifier |
|------|---------|---------|-------------------|
| `requirements.txt` | paho-mqtt | **Yes** | `==2.1.0` (exact) |
| `neuralsense_pi/requirements.txt` | paho-mqtt | **Yes** | `==2.1.0` (exact) |
| `neuralsense_pi/requirements.txt` | scapy | **Yes** | `==2.6.1` (exact) |

모든 의존성이 `==`로 정확한 버전에 고정되어 있음. 이는 재현 가능한 빌드를 보장하는 좋은 관행임.

**단, transitive dependencies(간접 의존성)는 고정되지 않음:**

| Package | Known Transitive Dependencies |
|---------|-------------------------------|
| `paho-mqtt==2.1.0` | 없음 (pure Python, 외부 의존성 없음) |
| `scapy==2.6.1` | 없음 (core는 pure Python). 단, 선택적으로 `cryptography`, `matplotlib`, `pyx` 등을 사용할 수 있으나 이 프로젝트에서는 불필요. |

> 현재 프로젝트의 두 패키지 모두 transitive dependency가 없어 간접 의존성 문제는 발생하지 않음.

#### 2. Lock File

**존재하지 않음.**

- `poetry.lock` -- 없음 (Poetry 미사용)
- `Pipfile.lock` -- 없음 (Pipenv 미사용)
- `pip-tools`의 `requirements.in` / `requirements.txt` 생성 패턴도 사용하지 않음

직접 의존성이 2개뿐이고 모두 exact pinning되어 있으므로 lock file 부재의 실질적 위험은 낮음.

#### 3. Version Conflict Potential

##### paho-mqtt 2.x API 호환성 문제 (Risk: **HIGH**)

`paho-mqtt` 2.x는 1.x 대비 **breaking changes**를 도입했음. 현재 코드는 v1 스타일 API를 사용 중:

| Issue | Current Code | paho-mqtt 2.x Requirement |
|-------|-------------|---------------------------|
| Client 생성자 | `mqtt.Client(client_id="...")` | `mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id="...")` 또는 새 v2 callback signature 사용 필요 |
| on_connect 시그니처 | `def on_connect(client, userdata, flags, rc)` | v2에서는 `def on_connect(client, userdata, flags, reason_code, properties)` (5 params) |
| on_message 시그니처 | `def on_message(client, userdata, msg)` | v2에서는 동일 (변경 없음) |
| on_disconnect 시그니처 | `def on_disconnect(client, userdata, rc)` | v2에서는 `def on_disconnect(client, userdata, flags, reason_code, properties)` (5 params) |

**영향을 받는 파일:**

```
run_live.py:201         mqtt.Client(client_id="laptop-live")
run_live_test.py:256    mqtt.Client(client_id="laptop-live")
calibrate_interactive.py:107  mqtt.Client(client_id="laptop-calibrate")
neuralsense_pi/sniff_and_send.py:75       mqtt.Client(client_id="sniffer-...")
neuralsense_pi/sniff_and_send_unified.py:141  mqtt.Client(client_id="sniffer-...")
```

**현재 동작:** paho-mqtt 2.1.0에서 `CallbackAPIVersion`을 명시하지 않으면 `VERSION1`이 기본값으로 사용되며 **deprecation warning**이 발생함. 향후 paho-mqtt 3.x에서는 이 fallback이 제거될 수 있음.

**권장 수정:**

```python
# Before (current, v1 style)
client = mqtt.Client(client_id="laptop-live")

# After (v2 explicit)
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="laptop-live")
```

##### scapy 호환성 (Risk: **LOW**)

- `scapy==2.6.1`은 안정 버전이며, 사용하는 API(`sniff()`, `Dot11`, `dBm_AntSignal`)는 핵심 기능으로 변경 가능성이 낮음.
- scapy는 `libpcap`/`tcpdump`를 시스템 레벨에서 필요로 하며, 이는 Raspberry Pi OS에 기본 포함됨.

##### Laptop vs Pi 환경 불일치 (Risk: **LOW**)

- 두 `requirements.txt`에서 `paho-mqtt` 버전이 동일(`2.1.0`)하므로 MQTT 프로토콜 수준의 불일치는 없음.
- Python 버전이 Laptop과 Pi에서 다를 수 있으나, 코드가 3.5+ 호환이므로 실질적 문제는 낮음.

---

## Section 5: Hardware-Dependent Code

### 5-1. Hardware Direct Access Code

#### 1. RPi.GPIO Usage

**사용하지 않음.** `RPi.GPIO`, `gpiozero`, `pigpio` 등 GPIO 라이브러리를 import하는 코드가 전혀 없음.

이 프로젝트는 GPIO 핀을 직접 제어하지 않으며, 하드웨어 상호작용은 전적으로 **Wi-Fi 어댑터**(모니터 모드)를 통해 이루어짐.

#### 2. Camera Driver

**사용하지 않음.** `picamera`, `picamera2`, `cv2` (OpenCV), `VideoCapture` 등 카메라 관련 코드가 전혀 없음.

#### 3. I2C / SPI / UART Communication

**사용하지 않음.** `smbus`, `spidev`, `serial` (pyserial), 또는 `/dev/i2c-*`, `/dev/spi*`, `/dev/ttyS*` 등의 디바이스 파일 접근이 없음.

#### 4. Other Hardware Interfaces

이 프로젝트의 하드웨어 인터페이스는 **Wi-Fi 어댑터 (모니터 모드)** 단 하나임. 접근 방식은 두 가지로 나뉨:

##### A. Scapy를 통한 패킷 캡처 (핵심 하드웨어 의존)

| File | API | Hardware Requirement |
|------|-----|---------------------|
| `neuralsense_pi/sniff_and_send.py:5-6` | `from scapy.all import sniff` / `from scapy.layers.dot11 import Dot11` | 모니터 모드 Wi-Fi 어댑터 |
| `neuralsense_pi/sniff_and_send.py:104` | `sniff(iface=args.iface, prn=handle, store=False)` | `libpcap` + 모니터 모드 인터페이스 |
| `neuralsense_pi/sniff_and_send.py:40-41` | `pkt.dBm_AntSignal` | Wi-Fi 어댑터의 RadioTap 헤더 (RSSI 값) |
| `neuralsense_pi/sniff_and_send_unified.py:21-22` | 동일한 scapy import | 동일 |
| `neuralsense_pi/sniff_and_send_unified.py:182` | `sniff(iface=iface, prn=handle, store=False)` | 동일 |

##### B. 시스템 명령어를 통한 네트워크 인터페이스 제어

| File | Command | Purpose |
|------|---------|---------|
| `neuralsense_pi/set_monitor_mode.py:10` | `os.listdir("/sys/class/net")` | wlan 인터페이스 목록 조회 |
| `neuralsense_pi/set_monitor_mode.py:14` | `ip route show default` | 기본 경로(SSH용) 인터페이스 확인 |
| `neuralsense_pi/set_monitor_mode.py:27` | `nmcli dev disconnect {iface}` | NetworkManager에서 인터페이스 해제 |
| `neuralsense_pi/set_monitor_mode.py:33` | `sudo ip link set {iface} down` | 인터페이스 비활성화 |
| `neuralsense_pi/set_monitor_mode.py:40` | `sudo iw dev {iface} set type monitor` | **모니터 모드 전환 (핵심)** |
| `neuralsense_pi/set_monitor_mode.py:44` | `sudo ip link set {iface} up` | 인터페이스 재활성화 |
| `neuralsense_pi/set_monitor_mode.py:49` | `iwconfig {iface}` | 모니터 모드 확인 |
| `neuralsense_pi/set_channel.sh:5-8` | `sudo ifconfig`, `sudo iwconfig` | 모니터 모드 설정 + 채널 변경 |

> **Note:** 모든 시스템 명령어는 `subprocess.check_output(cmd, shell=True)` 또는 shell script로 실행되며, `sudo` 권한이 필요함.

---

### 5-2. Simulation / Mocking Capability

#### 1. Mocking Code

**없음.** 프로젝트 전체에 `mock`, `Mock`, `unittest.mock`, `simulator`, `fake`, `stub` 등의 코드가 전혀 없음. 테스트 프레임워크(`pytest`, `unittest`)도 설정되지 않음.

#### 2. Development Mode vs Production Mode

**부분적으로 존재.** `sniff_and_send_unified.py`에 3가지 모드가 CLI 인자로 구분됨:

| Mode | CLI Flag | Behavior |
|------|----------|----------|
| **CALIBRATION** | `--target-mac <mac>` | 지정된 단일 MAC만 publish (캘리브레이션용) |
| **TEST** | `--track-macs "mac1,mac2,..."` | 지정된 MAC 목록만 publish (정확도 테스트용) |
| **PRODUCTION** | (기본값, 플래그 없음) | 모든 MAC publish (실시간 운영) |

```python
# sniff_and_send_unified.py:117-126
if target_mac:
    mode = "CALIBRATION(target_mac)"
elif track_macs:
    mode = "TEST(track_macs)"
else:
    mode = "PRODUCTION(all_macs)"
```

**그러나 이 모드들은 모두 실제 하드웨어를 필요로 함.** 모니터 모드 Wi-Fi 어댑터 없이는 어떤 모드도 실행 불가.

Laptop 측 스크립트(`run_live.py`, `run_live_test.py`)도 유사하게 분리됨:
- `run_live.py`: `MIN_SOURCES=8` (프로덕션, 엄격)
- `run_live_test.py`: `MIN_SOURCES=6` (테스트, 완화) + heartbeat 로깅 + disconnect handler

#### 3. Environment Variable for Hardware Mode Switching

**없음.** 환경 변수가 전혀 사용되지 않으며(Section 3 참조), 하드웨어 모드 전환도 불가능함.

**하드웨어 없이 테스트하기 위한 잠재적 방법 (현재 미구현):**

| Approach | Feasibility | Description |
|----------|-------------|-------------|
| MQTT 메시지 재생 | **높음** | Laptop 측 코드(`run_live.py`)는 MQTT 메시지만 소비하므로, 과거 `raw_rssi.jsonl` 데이터를 MQTT에 재발행하면 Pi 없이 테스트 가능 |
| Scapy pcap 재생 | **중간** | 캡처된 `.pcap` 파일을 `scapy.sniff(offline=...)` 로 재생 가능하나, 현재 pcap 저장 기능 미구현 |
| 완전 모킹 | **낮음** | scapy sniff, MQTT 연결 등을 전부 mock해야 하며, 테스트 인프라가 없음 |

---

### 5-3. Platform Dependencies

#### 1. Raspberry Pi Only Code

다음 파일들은 **Raspberry Pi에서만 실행 가능:**

| File | Pi-Only Reason |
|------|---------------|
| `neuralsense_pi/sniff_and_send.py` | 모니터 모드 Wi-Fi 어댑터 + scapy 패킷 캡처 (root 권한 필요) |
| `neuralsense_pi/sniff_and_send_unified.py` | 동일 |
| `neuralsense_pi/set_monitor_mode.py` | `iw`, `ip link`, `iwconfig`, `nmcli` 명령어 사용. `/sys/class/net` 읽기 |
| `neuralsense_pi/set_channel.sh` | `ifconfig`, `iwconfig` 명령어 사용 |

> **정확히는 "Raspberry Pi 전용"이 아니라 "모니터 모드를 지원하는 Wi-Fi 어댑터가 있는 Linux 시스템"에서 실행 가능.** 그러나 프로젝트 설계상 Raspberry Pi를 전제로 함 (변수명 `rpi_id`, Pi 호스트명 `pi5`, `pi10` 등).

#### 2. Linux Only Code

| Code | Linux Dependency | Affected Files |
|------|-----------------|----------------|
| `/sys/class/net` 읽기 | **Linux sysfs** (macOS/Windows에 없음) | `set_monitor_mode.py:10` |
| `iw dev ... set type monitor` | **Linux `iw` tool** | `set_monitor_mode.py:40` |
| `ip link set ... down/up` | **Linux `iproute2`** | `set_monitor_mode.py:33,44` |
| `iwconfig` | **Linux wireless-tools** | `set_monitor_mode.py:49`, `set_channel.sh:8-9` |
| `ifconfig` | **Linux net-tools** (deprecated) | `set_channel.sh:5,7` |
| `nmcli dev disconnect` | **NetworkManager** (Linux) | `set_monitor_mode.py:27` |
| `ip route show default` | **Linux `iproute2`** | `set_monitor_mode.py:14` |
| scapy `sniff()` with Dot11 | **Linux `libpcap`** + 모니터 모드 | `sniff_and_send*.py` |

**시스템 도구 의존성 요약 (Pi 측):**

```
필수: iw, ip (iproute2), libpcap, python3
선택: iwconfig (wireless-tools), ifconfig (net-tools), nmcli (NetworkManager)
권한: sudo (root) -- 모니터 모드 전환 및 raw 패킷 캡처에 필수
```

#### 3. Cross-Platform Compatibility

| Component | Linux | macOS | Windows | Notes |
|-----------|-------|-------|---------|-------|
| **Laptop scripts** (`run_live.py`, `run_live_test.py`, `calibrate_interactive.py`, `accuracy_test_from_zone_assignments.py`) | **Yes** | **Yes** | **Yes** | MQTT + 표준 라이브러리만 사용. 플랫폼 독립적. |
| **Pi sniffers** (`sniff_and_send*.py`) | **Yes** | **No** (Dot11 모니터 모드 미지원) | **No** | scapy Dot11 + 모니터 모드 필수 |
| **Pi setup** (`set_monitor_mode.py`, `set_channel.sh`) | **Yes** | **No** (`iw`, `/sys/class/net` 없음) | **No** | Linux sysfs + iproute2 전용 |

**결론:**

- **Laptop 측 (4개 파일):** 완전한 크로스 플랫폼 호환. MQTT 브로커에 네트워크 접근만 가능하면 Linux, macOS, Windows 모두에서 실행 가능.
- **Pi 측 (4개 파일):** Linux 전용. 모니터 모드를 지원하는 Wi-Fi 어댑터와 root 권한이 필수. Raspberry Pi OS (Debian 기반) 환경을 전제로 설계됨.

---

## Section 6: Backend Communication Protocols

### 6-1. MQTT Usage

이 프로젝트의 **유일한 네트워크 통신 프로토콜**은 MQTT임. Raspberry Pi(publisher) → MQTT Broker → Laptop(subscriber) 단방향 데이터 흐름으로 구성.

#### 1. MQTT Broker Address

**하드코딩** (환경 변수 미사용):

| Constant | Value | Location |
|----------|-------|----------|
| `MQTT_HOST` | `"100.87.27.7"` | 모든 Python 파일 (5개) |
| `MQTT_PORT` | `1883` | 모든 Python 파일 (5개) |

- IP `100.87.27.7`은 **Tailscale VPN** 주소로, `pi10`에서 Mosquitto 브로커를 실행하는 것으로 추정됨.
- 포트 `1883`은 MQTT 기본 포트 (비암호화). **TLS(8883) 미사용.**
- 인증 (username/password) 설정 없음 — 브로커가 anonymous 접근을 허용하는 것으로 추정.

#### 2. Topic Structure

| Topic Pattern | Direction | Payload Format | Purpose |
|---------------|-----------|----------------|---------|
| `neuralsense/rssi` | **Pi → Broker** (publish) | JSON | 각 Pi가 캡처한 Wi-Fi RSSI 데이터를 실시간 발행 |
| `neuralsense/rssi` | **Broker → Laptop** (subscribe) | JSON | Laptop이 모든 Pi의 RSSI 데이터를 구독하여 zone matching 수행 |

**토픽이 단 1개.** 계층적 토픽 구조(`neuralsense/rssi/{rpi_id}` 등)를 사용하지 않고, 단일 토픽에 모든 Pi의 데이터가 혼합됨. 발신자 구분은 payload 내 `rpi_id` 필드로 수행.

**MQTT Payload Schema:**

```json
{
  "ts": 1700000000.123,
  "rpi_id": "pi10",
  "mac": "a8:76:50:e9:28:20",
  "rssi": -67
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ts` | `float` | Unix timestamp (초 단위, 소수점 이하 포함) |
| `rpi_id` | `string` | Raspberry Pi 식별자 (`pi5`, `pi7`, `pi8`, `pi9`, `pi10`, `pi11`, `pi12`, `pi13`) |
| `mac` | `string` | 감지된 기기의 MAC 주소 (소문자, 콜론 구분). `--hash-macs` 사용 시 SHA-256 해시 16자리 |
| `rssi` | `int` | 수신 신호 강도 (dBm, 음수). 범위: -95 ~ -20 |

#### 3. QoS Level

| Location | QoS | Retain | Notes |
|----------|-----|--------|-------|
| `sniff_and_send.py:95,101` (publish) | **0** | `False` | Fire-and-forget. 패킷 손실 허용 |
| `sniff_and_send_unified.py:147` (publish) | **0** | `False` | 동일 |
| `run_live.py:108` (subscribe) | **미지정** (기본값 0) | — | `client.subscribe(MQTT_TOPIC)` QoS 파라미터 생략 |
| `run_live_test.py:120` (subscribe) | **미지정** (기본값 0) | — | 동일 |
| `calibrate_interactive.py:110` (subscribe) | **미지정** (기본값 0) | — | 동일 |

> **QoS 0 선택 근거:** RSSI 데이터는 초당 수백 건 발생하는 고빈도 스트림이며, 개별 메시지 손실은 rolling window 기반 중앙값 계산으로 흡수됨. QoS 1/2의 재전송 오버헤드가 불필요.

#### 4. Keep-Alive

| File | Keep-Alive (sec) |
|------|-----------------|
| `run_live.py:206` | `30` |
| `run_live_test.py:268` | `30` |
| `calibrate_interactive.py:109` | `30` |
| `sniff_and_send.py:76` | `30` |
| `sniff_and_send_unified.py:142` | `30` |

**모든 파일에서 `keepalive=30`으로 동일.** 브로커는 30초 × 1.5 = 45초 동안 PINGREQ가 없으면 클라이언트를 dead로 판단.

#### 5. Reconnect Logic

| File | Reconnect Strategy | Details |
|------|-------------------|---------|
| `run_live.py:204,207` | **자동 재연결** | `reconnect_delay_set(min_delay=1, max_delay=10)` + `loop_forever(retry_first_connection=True)` |
| `run_live_test.py:262,274` | **자동 재연결** | 동일. 추가로 `on_disconnect` 콜백에서 로깅 |
| `calibrate_interactive.py:111` | **재연결 없음** | `loop_start()` 사용. 별도 reconnect 설정 없음 (단기 대화형 세션) |
| `sniff_and_send.py:77` | **재연결 없음** | `loop_start()` 사용. 브로커 연결 끊김 시 publish 실패하지만 sniff는 계속됨 |
| `sniff_and_send_unified.py:143` | **재연결 없음** | 동일 |

**MQTT Client ID 및 Loop Model:**

| File | Client ID | Loop Model | Blocking? |
|------|-----------|------------|-----------|
| `run_live.py` | `"laptop-live"` | `loop_forever()` | Yes (메인 스레드 차단) |
| `run_live_test.py` | `"laptop-live"` | `loop_forever()` | Yes |
| `calibrate_interactive.py` | `"laptop-calibrate"` | `loop_start()` + manual loop | No (백그라운드 스레드) |
| `sniff_and_send.py` | `"sniffer-{rpi_id}"` | `loop_start()` + `scapy.sniff()` | sniff()가 메인 스레드 차단 |
| `sniff_and_send_unified.py` | `"sniffer-{rpi_id}"` | `loop_start()` + `scapy.sniff()` | 동일 |

> **주의:** `run_live.py`와 `run_live_test.py`가 동일한 Client ID `"laptop-live"`를 사용하므로, 두 스크립트를 동시에 실행하면 MQTT 브로커에서 **client ID 충돌**이 발생하여 한 쪽이 강제 disconnect됨.

---

### 6-2. HTTP/REST Usage

**사용하지 않음.**

- `requests`, `urllib`, `http.client`, `aiohttp`, `httpx` 등의 HTTP 라이브러리가 import되지 않음.
- REST API 엔드포인트 호출 코드 없음.
- Supabase Edge Function 호출 없음.
- 인증 헤더 (Authorization, API Key 등) 설정 없음.
- 타임아웃 설정 없음 (HTTP 자체가 미사용).

#### Supabase Edge Function

**미사용.** `supabase`, `supabase-py`, `@supabase/functions-js` 등의 import 또는 Supabase URL 패턴(`*.supabase.co/functions/v1/*`)이 코드에 전혀 없음.

---

### 6-3. WebSocket Usage

**사용하지 않음.**

- `websocket`, `websockets`, `socketio`, `socket.io` 등의 라이브러리가 import되지 않음.
- `ws://` 또는 `wss://` URL 패턴 없음.
- paho-mqtt의 WebSocket transport (`transport="websockets"`)도 사용하지 않음 — 순수 TCP MQTT.

---

### 6-4. Data Serialization

#### 1. Serialization Format

**JSON 단독 사용.** Protobuf, MessagePack, Avro, CBOR 등 바이너리 직렬화 형식 미사용.

모든 JSON 직렬화에 **compact format** 적용:

```python
json.dumps(obj, separators=(",", ":"))  # 공백 제거하여 바이트 절약
```

#### 2. Schema Definition

**별도 스키마 정의 파일 없음.** `.proto`, `.avsc`, JSON Schema 등이 존재하지 않음.

스키마는 코드 내에서 암묵적으로 정의됨. 아래는 프로젝트에서 사용되는 모든 JSON 구조:

##### A. MQTT Payload (Pi → Laptop)

```json
{"ts": 1700000000.123, "rpi_id": "pi10", "mac": "a8:76:50:e9:28:20", "rssi": -67}
```

##### B. JSONL File Schemas

| File | Schema Fields |
|------|--------------|
| `output/raw_rssi.jsonl` | `ts`, `ts_kst`, `phone_id`, `rpi_id`, `rssi` |
| `output/zone_assignments.jsonl` | `ts`, `ts_kst`, `phone_id`, `zone_id`, `x`, `y`, `confidence`, `sources`, `vector` |
| `output/transitions.jsonl` | `ts`, `ts_kst`, `phone_id`, `from_zone`, `to_zone`, `confidence` |
| `output/dwells.jsonl` | `phone_id`, `zone_id`, `enter_ts`, `enter_ts_kst`, `exit_ts`, `exit_ts_kst`, `dwell_sec` |
| `output/run_live_errors.jsonl` | `ts`, `ts_kst`, `where`, `error`, `extra` (optional) |
| `output/calibration.jsonl` | `created_ts`, `created_ts_kst`, `zone_id`, `x`, `y`, `phone_mac_used`, `max_samples_per_pi`, `sync_window_sec`, `min_pis_for_vector`, `vectors_collected`, `vectors` |

#### 3. Serialization / Deserialization Code Locations

##### Serialization (`json.dumps`)

| File | Line | Context |
|------|------|---------|
| `sniff_and_send.py` | 95, 101 | MQTT publish: RSSI 데이터 → JSON string |
| `sniff_and_send_unified.py` | 147 | MQTT publish: RSSI 데이터 → JSON string |
| `run_live.py` | 37 | File write: `safe_append_jsonl()` — raw, assignment, transition, dwell, error |
| `run_live_test.py` | 38 | File write: 동일 |
| `calibrate_interactive.py` | 58 | File write: `append_jsonl()` — calibration record |
| `accuracy_test_from_zone_assignments.py` | 43 | File write: accuracy result 저장 |

##### Deserialization (`json.loads`)

| File | Line | Context |
|------|------|---------|
| `run_live.py` | 68 | File read: `calibration.jsonl` 로드 |
| `run_live.py` | 115 | MQTT receive: `msg.payload.decode("utf-8")` → JSON parse |
| `run_live_test.py` | 75 | File read: `calibration.jsonl` 로드 |
| `run_live_test.py` | 139 | MQTT receive: payload → JSON parse |
| `calibrate_interactive.py` | 96 | MQTT receive: payload → JSON parse |
| `accuracy_test_from_zone_assignments.py` | 74 | File read: `zone_assignments.jsonl` 실시간 tail |

> **Note:** MQTT payload 디코딩은 항상 `msg.payload.decode("utf-8")` → `json.loads()` 2단계로 수행됨. 파일 I/O는 `encoding="utf-8"`로 열어 한 줄씩 `json.loads()` 적용 (JSONL 형식).

---

## Section 7: AI Model Files

### 7-1. Model File Inventory

**모델 파일이 존재하지 않음.**

| 파일명 | 형식 | 크기 (MB) | 위치 | 용도 |
|-------|------|----------|------|------|
| *(없음)* | — | — | — | — |

프로젝트 전체에서 `.onnx`, `.tflite`, `.pt`, `.pth`, `.h5`, `.hdf5`, `.pkl`, `.joblib`, `.pb`, `.savedmodel`, `.safetensors`, `.gguf` 등 **어떤 ML 모델 파일도 발견되지 않음.**

> **"NeuralSense"라는 프로젝트명에도 불구하고, 이 프로젝트는 신경망(Neural Network)을 사용하지 않음.** Zone 매칭 알고리즘은 **RSSI 핑거프린팅 (평균 차이 기반 최근접 이웃 매칭)** 으로, 순수 수학적 비교 방식임:

```python
# run_live.py:82-86 — "AI" 대신 사용되는 zone matching 알고리즘
def avg_diff(live_vec, cal_vec):
    common = [p for p in live_vec if p in cal_vec]
    if not common:
        return float("inf")
    return sum(abs(int(live_vec[p]) - int(cal_vec[p])) for p in common) / float(len(common))
```

이 알고리즘은:
1. 실시간 RSSI 벡터와 캘리브레이션 벡터 간 **공통 Pi에 대한 평균 절대 차이**를 계산
2. 차이가 `MATCH_DIFF_DBM=7.0` dBm 이하인 벡터를 "match"로 판정
3. match 비율이 가장 높은 zone을 선택 (confidence = matches / total_vectors)

---

### 7-2. Model Loading Code

#### 1. Model Loading Location

**없음.** `torch.load()`, `tf.saved_model.load()`, `pickle.load()`, `joblib.load()`, `onnxruntime.InferenceSession()` 등 모델 로딩 코드가 전혀 없음.

대신 **캘리브레이션 데이터**(JSONL)를 "모델" 역할로 로드:

| File | Line | Loading Code | What's Loaded |
|------|------|-------------|---------------|
| `run_live.py` | 60-80 | `load_calibration()` | `output/calibration.jsonl` → zone별 RSSI 벡터 dictionary |
| `run_live_test.py` | 67-87 | `load_calibration()` | 동일 |

```python
# run_live.py:60-80 — 캘리브레이션 데이터 로딩 (사실상 "모델 로딩")
def load_calibration():
    latest = {}
    with open(CAL_JSONL, "r", encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            zid = int(rec["zone_id"])
            # zone별 가장 최신 캘리브레이션만 유지
            if zid not in latest or created > float(latest[zid].get("created_ts", 0)):
                latest[zid] = rec
    return latest
```

#### 2. Inference Code Location

| File | Line | Function | Description |
|------|------|----------|-------------|
| `run_live.py` | 82-86 | `avg_diff()` | 두 벡터 간 평균 dBm 차이 계산 |
| `run_live.py` | 156-168 | `on_message()` 내부 | 모든 캘리브레이션 zone에 대해 `avg_diff()` 실행, 최고 confidence zone 선택 |
| `run_live_test.py` | 89-93, 183-198 | 동일 구조 | 동일 |

#### 3. Pre/Post-processing Code Location

**전처리 (Preprocessing):**

| File | Line | Function | Description |
|------|------|----------|-------------|
| `sniff_and_send.py` | 16-36 | `normalize_rssi()` | unsigned→signed 변환, 범위 필터링 (-95 ~ -20 dBm) |
| `run_live.py` | 144-148 | `on_message()` 내부 | Pi별 중앙값 계산 (`statistics.median`), rolling window 관리 |
| `calibrate_interactive.py` | 68-72 | `outlier_ok()` | 최근 4개 중앙값 대비 15 dBm 이상 벗어나는 outlier 제거 |

**후처리 (Postprocessing):**

| File | Line | Description |
|------|------|-------------|
| `run_live.py` | 170-199 | zone 할당 → transition 감지 → dwell 계산 → JSONL 파일 기록 |

---

### 7-3. Model Version Management

#### 1. Git LFS

**사용하지 않음.** `.gitattributes`에 LFS 설정이 없으며, `git lfs ls-files` 결과가 비어 있음.

#### 2. Model Version Naming Convention

**해당 없음.** 모델 파일이 없으므로 버전 네이밍 규칙도 없음.

캘리브레이션 데이터의 버전 관리는 JSONL append 방식으로 처리:
- 새 캘리브레이션은 기존 파일에 **추가**(append)됨
- 로딩 시 `created_ts` 기준으로 **zone별 최신 레코드만** 사용
- 사실상 "최신 우선" 전략이며, 별도 버전 번호는 없음

#### 3. Model Download Script

**없음.** 외부에서 모델을 다운로드하는 스크립트나 코드 없음.

#### 4. External Model Storage

**없음.** S3, HuggingFace Hub, GCS, Azure Blob 등 외부 저장소 접근 코드 없음. 모든 "모델" 데이터(캘리브레이션 벡터)는 `calibrate_interactive.py`를 실행하여 **현장에서 직접 수집**.

---

### 7-4. Model Performance

#### 1. Inference Timing

**별도 측정 코드 없음.** 추론 시간을 측정하거나 로깅하는 `time.time()` diff, profiling, `timeit` 등이 추론 경로에 없음.

**추정 추론 시간:**

| Operation | Complexity | Estimated Time |
|-----------|-----------|----------------|
| `avg_diff()` 1회 호출 | O(Pi 수) ≈ O(8) | < 0.01ms |
| 모든 zone 스캔 | O(zone 수 × 벡터 수) ≈ O(19 × ~10) | < 1ms |
| **총 zone matching** (메시지 1건) | 위 합산 | **< 1ms** |

> 알고리즘이 단순한 사칙연산(뺄셈 절대값 평균)이므로, GPU 없이도 **실시간 처리에 전혀 문제가 없는 속도**임.

#### 2. Batch Processing

**없음.** MQTT 메시지 도착마다 **건건이(one-by-one)** zone matching을 수행. 여러 메시지를 모아서 배치 처리하는 코드 없음.

#### 3. GPU/TPU Usage

**없음.** `torch.cuda`, `tensorflow.config.experimental`, `cupy`, `onnxruntime` GPU provider 등 GPU/TPU 가속 코드가 전혀 없음. **CPU 단독 실행.**

> **결론:** 이 프로젝트는 전통적 ML/DL 모델을 사용하지 않음. "NeuralSense"는 프로젝트 브랜딩명일 뿐이며, 실제 zone 위치추정은 **RSSI 핑거프린팅 + 평균 차이 비교**라는 통계 기반 알고리즘으로 동작함. 향후 정확도 향상을 위해 kNN, Random Forest, 또는 경량 신경망을 도입할 수 있는 구조적 여지는 있으나, 현재는 미구현.

---

## Section 8: Supabase Connection

### 8-1. Supabase Client

#### 1. supabase-py Usage

**사용하지 않음.** `supabase`, `supabase-py`, `postgrest`, `gotrue`, `realtime` 등 Supabase 관련 패키지가 `requirements.txt`에 없고, 코드 어디에서도 import되지 않음.

#### 2. Client Initialization Code

**없음.** `create_client()`, `supabase.Client()` 등의 초기화 코드가 존재하지 않음.

#### 3. Authentication Method

**해당 없음.** Supabase를 사용하지 않으므로 `anon key`, `service_role key`, JWT 등의 인증 방식이 없음.

> **현재 아키텍처:** 이 프로젝트는 클라우드 DB를 사용하지 않고, MQTT 브로커(Pi 중 하나에서 로컬 실행)와 로컬 파일 시스템(JSONL)만으로 데이터를 처리함.

---

### 8-2. Table Access

**해당 없음.** Supabase 테이블(PostgreSQL)에 접근하는 코드가 없음.

| 테이블명 | 작업 (select/insert/update) | 코드 위치 |
|---------|---------------------------|----------|
| *(없음)* | — | — |

데이터 영속화는 전적으로 **로컬 JSONL 파일**로 수행됨 (Section 9-3 참조).

---

### 8-3. Edge Function Calls

**해당 없음.** Supabase Edge Function을 호출하는 코드가 없음.

| 함수명 | 용도 | 코드 위치 |
|-------|------|----------|
| *(없음)* | — | — |

HTTP 요청 라이브러리 자체가 프로젝트에 포함되지 않으므로(`requests`, `urllib`, `httpx` 등 미사용), 어떤 외부 Function도 호출하지 않음.

---

### 8-4. Realtime Subscription

**해당 없음.** Supabase Realtime(WebSocket 기반 PostgreSQL change notification)을 사용하지 않음.

실시간 데이터 스트리밍은 **MQTT**로 대체됨 (Section 6-1 참조):
- Pi → Broker: `client.publish()` (실시간 RSSI 발행)
- Broker → Laptop: `client.subscribe()` + `on_message` 콜백 (실시간 수신)

---

## Section 9: Data Flow

### 9-1. Sensor → Backend Flow

#### 1. Sensor Data Collection Interval

**이벤트 기반 (Event-Driven), 고정 주기 없음.**

각 Raspberry Pi는 scapy `sniff()` 함수로 Wi-Fi 패킷을 **연속 캡처**함. 수집 주기는 주변 기기의 Wi-Fi 활동(probe request, data frame 등)에 의해 결정되며, 별도의 polling interval이나 sleep이 없음:

```python
# sniff_and_send.py:104 / sniff_and_send_unified.py:182
sniff(iface=args.iface, prn=handle, store=False)  # 무한 루프, 패킷 도착 즉시 handle() 호출
```

**예상 데이터 레이트:**
- 활동적인 Wi-Fi 환경: Pi 당 초당 수십~수백 패킷
- 조용한 환경: Pi 당 초당 수 패킷
- 8개 Pi × 수십 msg/sec = Laptop에서 **초당 수백 MQTT 메시지** 수신

#### 2. Data Transmission Interval

**실시간 (Real-Time), 배치 없음.**

패킷 캡처 → JSON 직렬화 → MQTT publish가 **동기적으로** 수행됨. 별도 버퍼링이나 배치 전송 없이 각 패킷이 도착하는 즉시 개별 MQTT 메시지로 발행:

```
[Wi-Fi Packet Captured] → handle(pkt) → get_rssi() → extract_macs() → client.publish()
```

| Stage | Latency |
|-------|---------|
| Packet capture → handle() | < 1ms (scapy callback) |
| handle() → publish() | < 1ms (JSON dumps + MQTT QoS 0) |
| Broker → Laptop delivery | ~1-10ms (LAN/Tailscale) |
| **총 end-to-end** | **~2-15ms** |

#### 3. Data Buffering

**Pi 측: 버퍼링 없음.** 각 패킷이 즉시 publish되며, 메모리 내 큐나 디스크 버퍼가 없음.

**Laptop 측: Rolling Window 버퍼:**

| Buffer | Type | Location | Capacity | Purpose |
|--------|------|----------|----------|---------|
| `buf[phone]` | `collections.deque` | `run_live.py:102`, `run_live_test.py:110` | 시간 기반 (최근 `WINDOW_SEC=5`초) | 각 phone별 RSSI 이력을 저장하여 Pi별 중앙값 계산 |
| `rssi_queue` | `queue.Queue` | `calibrate_interactive.py:92` | 무제한 (thread-safe) | MQTT 수신 스레드 → 메인 스레드 간 데이터 전달 |
| `samples[pi]` | `collections.deque` | `calibrate_interactive.py:125` | `MAX_SAMPLES_PER_PI=8` | 캘리브레이션 중 Pi별 RSSI 샘플 수집 |

Rolling window 동작 상세 (`run_live.py`):

```python
# run_live.py:137-141
d = buf[phone]
d.append((ts, rpi_id, rssi))       # 새 데이터 추가
cutoff = ts - WINDOW_SEC             # 5초 이전 컷오프
while d and d[0][0] < cutoff:
    d.popleft()                      # 만료된 데이터 제거
```

---

### 9-2. Backend → Device Flow

#### 1. Command/Config Reception

**없음.** 데이터 흐름이 **단방향 (Pi → Laptop)** 으로만 설계되어 있음.

- Laptop에서 Pi로 명령을 보내는 MQTT publish 코드 없음
- Pi 측에서 명령을 수신하는 subscribe 코드 없음
- 구성 변경은 Pi에 SSH 접속하여 스크립트를 수동으로 재시작하는 방식으로 추정

**현재 아키텍처:**

```
[Pi] ──publish──→ [MQTT Broker] ──subscribe──→ [Laptop]
                                              (단방향만 존재)
```

원격 제어가 필요한 경우의 예시 (현재 미구현):

| Potential Command | Current Method | Notes |
|-------------------|---------------|-------|
| Wi-Fi 채널 변경 | SSH → `set_channel.sh` 수동 실행 | 원격 MQTT 명령 없음 |
| 모니터 모드 전환 | SSH → `set_monitor_mode.py` 수동 실행 | 동일 |
| sniffer 재시작 | SSH → 프로세스 kill + 재시작 | 동일 |
| 캘리브레이션 모드 전환 | SSH → `--target-mac` 옵션 변경 후 재시작 | 동일 |

#### 2. Firmware Update Mechanism

**없음.** OTA(Over-The-Air) 업데이트, 자동 업데이트, 버전 체크 등의 코드가 전혀 없음.

코드 업데이트는 수동 방식으로 추정:
- SSH 접속 → `git pull` 또는 `scp`로 파일 전송 → 프로세스 재시작

---

### 9-3. Local Data Storage

#### 1. Local Database

**사용하지 않음.** `sqlite3`, `shelve`, `pickle`, `leveldb`, `tinydb` 등 로컬 DB 라이브러리가 import되지 않음. 모든 데이터 저장은 **평문 JSONL 파일**로 수행.

#### 2. File System Storage

##### Laptop 측 (output/)

| File | Writer | Mode | Growth Rate | Purpose |
|------|--------|------|-------------|---------|
| `output/raw_rssi.jsonl` | `run_live.py:134`, `run_live_test.py:159` | Append | **매우 빠름** (초당 수백 행) | 수신된 모든 RSSI 메시지 원본 기록 |
| `output/zone_assignments.jsonl` | `run_live.py:175`, `run_live_test.py:206` | Append | 중간 (zone 변경 시) | 각 phone의 zone 할당 결과 |
| `output/transitions.jsonl` | `run_live.py:190`, `run_live_test.py:221` | Append | 낮음 (zone 전환 시만) | zone 간 이동 이벤트 |
| `output/dwells.jsonl` | `run_live.py:197`, `run_live_test.py:235` | Append | 낮음 (zone 떠날 때만) | zone 체류 시간 기록 |
| `output/run_live_errors.jsonl` | `run_live.py:46`, `run_live_test.py:52` | Append | 극히 낮음 (에러 시만) | 런타임 에러 로깅 |
| `output/calibration.jsonl` | `calibrate_interactive.py:179` | Append | 캘리브레이션 시만 | zone별 캘리브레이션 벡터 |

##### Accuracy Test 측 (accuracy_tests/)

| File | Writer | Mode | Purpose |
|------|--------|------|---------|
| `accuracy_tests/neuralsense_test_zone_id_*_phone_id_*.jsonl` | `accuracy_test_from_zone_assignments.py:157` | Append | phone별, zone별 정확도 테스트 결과 |
| `accuracy_tests/neuralsense_accuracy_master_log.txt` | `accuracy_test_from_zone_assignments.py:46` | Append | 전체 정확도 요약 로그 (plain text) |

> **주의:** `raw_rssi.jsonl`은 모든 RSSI 메시지를 기록하므로 **디스크 공간이 빠르게 소진**될 수 있음. 8개 Pi에서 초당 수백 메시지 × 약 100 bytes/line = **시간당 수백 MB** 규모. 로그 로테이션이나 크기 제한 로직은 구현되지 않음.

##### Pi 측

**로컬 저장 없음.** Pi의 sniffer 스크립트는 데이터를 MQTT로만 발행하며, 로컬 파일에 저장하지 않음.

#### 3. Offline Data Queuing

**없음.** MQTT 브로커 연결이 끊긴 상태에서의 데이터 큐잉 메커니즘이 구현되지 않음.

| Component | Offline Behavior |
|-----------|-----------------|
| **Pi sniffer** | MQTT publish 실패해도 scapy sniff는 계속 실행됨. 그러나 capture된 데이터는 **영구 손실** (로컬 버퍼/파일 저장 없음) |
| **Laptop subscriber** | MQTT 연결 끊김 → `run_live.py`/`run_live_test.py`는 자동 재연결 시도 (Section 6-1-5). 재연결 동안의 메시지는 QoS 0이므로 **영구 손실** |
| **Calibration tool** | 연결 끊김 시 `rssi_queue`에 새 데이터가 안 들어올 뿐, 기존 수집된 데이터는 유지. `TIMEOUT_SEC=180`초 후 자동 종료 |

**데이터 손실 시나리오:**

```
[Pi] ──sniff──→ [publish fail] ──→ 데이터 손실 (로컬 저장 없음)
                    │
                    └─ 브로커 다운, 네트워크 단절, Pi 재부팅 등

[Broker] ──→ [Laptop disconnected] ──→ 데이터 손실 (QoS 0, 큐잉 없음)
```

> **권장 개선:** 미션 크리티컬한 데이터의 경우, Pi 측에 로컬 JSONL 파일 버퍼를 추가하고, 브로커 재연결 시 미전송 데이터를 replay하는 store-and-forward 패턴을 적용할 수 있음.

---

## Section 10: Build & Deploy

### 10-1. How to Run

#### 1. Install Commands

**Laptop (subscriber/processor):**

```bash
# Python 가상환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

**Raspberry Pi (sniffer):**

```bash
# Python 가상환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate

# 의존성 설치
pip install -r neuralsense_pi/requirements.txt
```

#### 2. Run Commands

**Raspberry Pi 측 (각 Pi에서 순서대로 실행):**

```bash
# 1. 모니터 모드 설정 (최초 1회 또는 재부팅 후)
sudo python3 neuralsense_pi/set_monitor_mode.py

# 2. (선택) Wi-Fi 채널 고정
sudo bash neuralsense_pi/set_channel.sh 6 wlan1

# 3-a. 프로덕션 모드 (모든 MAC 캡처)
sudo python3 neuralsense_pi/sniff_and_send_unified.py --rpi-id pi5 --iface wlan1

# 3-b. 캘리브레이션 모드 (특정 MAC만)
sudo python3 neuralsense_pi/sniff_and_send_unified.py --rpi-id pi5 --iface wlan1 --target-mac a8:76:50:e9:28:20

# 3-c. 테스트 모드 (복수 MAC 추적)
sudo python3 neuralsense_pi/sniff_and_send_unified.py --rpi-id pi5 --iface wlan1 --track-macs "mac1,mac2,mac3"
```

**Laptop 측:**

```bash
# 캘리브레이션 (대화형)
python3 calibrate_interactive.py

# 실시간 zone tracking (프로덕션)
python3 run_live.py

# 실시간 zone tracking (테스트, MIN_SOURCES=6)
python3 run_live_test.py

# 정확도 테스트 (run_live.py가 실행 중일 때)
python3 accuracy_test_from_zone_assignments.py
```

> **실행 순서:** MQTT Broker 시작 → Pi sniffers 시작 → Laptop subscriber 시작 → (선택) Accuracy test 시작

#### 3. Required System Packages

**Raspberry Pi:**

```bash
# 필수
sudo apt-get install -y python3 python3-venv python3-pip
sudo apt-get install -y iw                    # 모니터 모드 전환
sudo apt-get install -y libpcap-dev           # scapy 패킷 캡처
sudo apt-get install -y tcpdump               # scapy 런타임 의존

# 선택 (일부 스크립트에서 사용)
sudo apt-get install -y wireless-tools        # iwconfig (set_channel.sh, set_monitor_mode.py)
sudo apt-get install -y net-tools             # ifconfig (set_channel.sh)
sudo apt-get install -y network-manager       # nmcli (set_monitor_mode.py)

# MQTT 브로커 (pi10에서만)
sudo apt-get install -y mosquitto mosquitto-clients
```

**Laptop:**

```bash
# 필수
sudo apt-get install -y python3 python3-venv python3-pip
# (또는 macOS: brew install python3)
# (또는 Windows: python.org에서 설치)
```

> Laptop 측은 시스템 패키지 의존성이 없음 (paho-mqtt는 pure Python).

---

### 10-2. Deployment Method

#### 1. Device Deployment

**수동 SSH 배포** (추정). 자동화 도구(Ansible, Fabric, Docker 등)가 설정되어 있지 않음.

| Method | Used? | Notes |
|--------|-------|-------|
| SSH + scp/rsync | **추정** (Yes) | 코드를 각 Pi에 수동 복사 |
| Git clone/pull | **가능** | 각 Pi에서 `git pull` 실행 가능하나 확인 불가 |
| Ansible | No | `ansible.cfg`, `playbook.yml` 등 없음 |
| Docker | No | `Dockerfile`, `docker-compose.yml` 없음 |
| Fabric/Paramiko | No | 해당 라이브러리 미사용 |
| SD Card 이미지 | **가능** | Pi OS 이미지에 코드를 미리 포함시킬 수 있으나 확인 불가 |

**배포 대상:**

```
pi5, pi7, pi8, pi9, pi10, pi11, pi12, pi13 — 총 8대의 Raspberry Pi
+ 1대의 Laptop (subscriber)
```

#### 2. Auto-Update Mechanism

**없음.** OTA, watchdog, 자동 git pull, 버전 체크 등의 코드가 전혀 없음.

#### 3. CI/CD Configuration

**없음.** `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `Makefile` 등 CI/CD 설정 파일이 전혀 없음.

---

### 10-3. Service Registration

#### 1. systemd Service File

**없음.** `.service` 파일이 프로젝트 내에 존재하지 않으며, `systemd`, `systemctl`, `ExecStart`, `WantedBy` 등의 키워드가 코드 어디에도 없음.

sniffer 스크립트는 SSH 세션에서 수동으로 실행하는 것으로 추정됨 (포그라운드 프로세스).

**권장 systemd 유닛 예시 (현재 미구현):**

```ini
# /etc/systemd/system/neuralsense-sniffer.service
[Unit]
Description=NeuralSense Wi-Fi Sniffer
After=network.target mosquitto.service

[Service]
Type=simple
User=root
WorkingDirectory=/home/pi/neuralsense/neuralsense_pi
ExecStart=/home/pi/neuralsense/.venv/bin/python sniff_and_send_unified.py --rpi-id pi5 --iface wlan1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

#### 2. Boot Auto-Start

**없음.** `rc.local`, `crontab @reboot`, systemd enable 등의 자동 시작 설정이 없음.

Pi가 재부팅되면 sniffer가 자동으로 시작되지 않으며, 수동으로 SSH 접속하여 재실행해야 함.

#### 3. Log Management

**구조화된 로그 관리 없음.**

| Component | Log Method | Log Location | Rotation |
|-----------|-----------|-------------|----------|
| Pi sniffer | `print()` to stdout | 터미널 (또는 nohup.out) | 없음 |
| Laptop `run_live.py` | `print()` + JSONL file | stdout + `output/run_live_errors.jsonl` | 없음 |
| Laptop `run_live_test.py` | `print()` + heartbeat | stdout + `output/run_live_errors.jsonl` | 없음 |
| Laptop calibration | `print()` to stdout | 터미널 | 없음 |

> `logging` 모듈을 사용하지 않고 `print()`와 `sys.stderr.write()`로 직접 출력. `paho-mqtt`의 `enable_logger()`가 `run_live.py:205`와 `run_live_test.py:265`에서 호출되어 MQTT 내부 로그가 stdout에 출력됨.

---

## Section 11: Notable Issues & Technical Debt

### 11-1. Hardware Dependencies

**특정 하드웨어 없이 개발/테스트 가능 여부:**

| Component | Without Hardware? | Method |
|-----------|-------------------|--------|
| Laptop scripts (`run_live.py` 등) | **가능** | MQTT 메시지를 모킹하거나 과거 `raw_rssi.jsonl`을 재발행 |
| Pi sniffers | **불가** | 모니터 모드 Wi-Fi 어댑터 필수. scapy `sniff()`가 실제 인터페이스 요구 |
| Calibration tool | **부분 가능** | MQTT 메시지 수신 부분만 테스트 가능, 실제 RSSI 데이터는 하드웨어 필요 |

**에뮬레이션 방법 (현재 미구현, 잠재적):**

1. **MQTT Replay** (가장 실현 가능): 과거 `raw_rssi.jsonl`을 읽어 MQTT 브로커에 재발행하는 스크립트 작성
2. **Scapy offline**: `.pcap` 파일을 `sniff(offline="file.pcap")` 로 재생 (pcap 저장 기능 추가 필요)
3. **Mock Wi-Fi adapter**: Linux `mac80211_hwsim` 모듈로 가상 Wi-Fi 인터페이스 생성 가능 (복잡)

---

### 11-2. Model File Management

**현재 이슈 없음.** ML 모델 파일이 존재하지 않으므로 (Section 7 참조):

- 대용량 바이너리 파일 Git 관리 문제 없음
- Git LFS 필요 없음
- 캘리브레이션 데이터(`calibration.jsonl`)는 텍스트 파일이므로 Git으로 직접 관리 가능

**향후 ML 모델 도입 시 고려사항:**

| Item | Recommendation |
|------|---------------|
| 모델 파일 저장 | Git LFS 또는 외부 스토리지 (S3, HuggingFace Hub) |
| 버전 관리 | DVC (Data Version Control) 또는 모델 레지스트리 |
| CI/CD 통합 | 모델 파일을 build artifact로 관리 |

---

### 11-3. Monorepo Integration Considerations

#### Python과 JS/TS 모노레포 공존 방법

| Approach | Pros | Cons |
|----------|------|------|
| **`apps/neuralsense/` 하위 디렉토리** | 기존 구조 유지, 독립 실행 가능 | Python/JS 빌드 시스템 분리 필요 |
| **Turborepo/Nx workspace** | JS/TS 빌드 캐싱 활용 | Python 프로젝트에 대한 지원 제한적 |
| **독립 서브 프로젝트** | 가장 간단, `requirements.txt` 유지 | 공유 코드 추출 어려움 |

**권장:** `apps/neuralsense/` 디렉토리로 이동하되, Python 프로젝트는 JS/TS 빌드 파이프라인과 독립적으로 관리.

#### 의존성 관리 도구 통합

```
monorepo/
├── package.json          # pnpm workspace root
├── pnpm-workspace.yaml
├── apps/
│   ├── web/              # JS/TS (pnpm)
│   ├── api/              # JS/TS (pnpm)
│   └── neuralsense/      # Python (pip/poetry)
│       ├── requirements.txt
│       ├── neuralsense_pi/
│       │   └── requirements.txt
│       └── ...
└── packages/
    └── shared-types/     # 공유 스키마/타입
```

- **pnpm**: JS/TS 패키지 관리
- **pip** (또는 **poetry**): Python 패키지 관리 — 별도 실행
- 두 시스템을 연결하는 root-level 스크립트 (예: `Makefile` 또는 Turborepo `pipeline`)

#### 공유 가능한 코드

| Shared Item | Current Location | Extraction Method |
|-------------|-----------------|-------------------|
| MQTT Payload Schema | 코드 내 암묵적 정의 | **JSON Schema** 파일로 추출 → `packages/shared-types/` |
| JSONL File Schemas | 코드 내 암묵적 정의 | 동일 |
| Zone 데이터 (`zones.csv`) | `zones.csv` | 그대로 공유 또는 JSON 변환 |
| Configuration constants | 각 파일에 하드코딩 | `config.json` 또는 `.env`로 추출 |

**JSON Schema → TypeScript 변환:**

```bash
# json-schema-to-typescript 패키지로 자동 변환
npx json-schema-to-typescript mqtt_payload.schema.json > MqttPayload.d.ts
```

---

### 11-4. Test Status

#### Test Files

| File | Is Test? | Notes |
|------|----------|-------|
| `run_live_test.py` | **No** (이름과 달리 테스트 아님) | `run_live.py`의 변형 버전 (MIN_SOURCES=6, heartbeat 추가). 실제 unit test가 아님 |
| `accuracy_test_from_zone_assignments.py` | **Integration test** (수동) | 실시간 zone 예측과 사용자 입력 ground truth를 비교하는 정확도 테스트. 자동화되지 않음 |

**자동 테스트: 전혀 없음.**

- `pytest`, `unittest`, `nose` 등 테스트 프레임워크 미설정
- `conftest.py`, `pytest.ini`, `setup.cfg [tool:pytest]` 없음
- `test_*.py` 또는 `*_test.py` 패턴의 실제 unit test 파일 없음
- `.coveragerc`, `tox.ini` 없음

#### Test Coverage

**0%.** 자동 테스트가 없으므로 코드 커버리지도 측정되지 않음.

#### Hardware Mocking Tests

**없음.** `unittest.mock`, `pytest-mock`, `monkeypatch` 등을 사용하는 하드웨어 모킹 테스트 없음.

---

### 11-5. Other Technical Debt

#### TODO / FIXME Comments

프로젝트 전체에서 발견된 인라인 주석:

| File | Line | Comment | Severity |
|------|------|---------|----------|
| `run_live.py` | 126 | `# FIX: normalize` | **Low** — `rpi_id`를 lowercase로 정규화. 이미 수정된 상태이나 주석이 남아 있음 |
| `set_monitor_mode.py` | 77 | `[WARN] Only one wlan interface found. SSH may disconnect.` | **Info** — 런타임 경고 메시지, 기술 부채 아님 |

> **TODO/FIXME 주석이 거의 없음** — 코드가 단순하고 범위가 좁기 때문.

#### Outdated Dependencies

| Package | Pinned | Latest (추정) | Risk |
|---------|--------|--------------|------|
| `paho-mqtt` | 2.1.0 | 2.x (latest) | **HIGH** — v1 스타일 API 사용 중, deprecation warning 발생 (Section 4-3 상세) |
| `scapy` | 2.6.1 | 2.6.x (latest) | **LOW** — 안정 버전, 핵심 API 변경 없음 |

#### Documentation Status

| Item | Exists? | Notes |
|------|---------|-------|
| README.md | **No** | 프로젝트 설명, 설치 방법, 사용법 문서 없음 |
| 인라인 주석 | **최소** | 파일 상단 간략 설명 (`sniff_and_send_unified.py`만 docstring 존재) |
| API 문서 | **No** | 함수/클래스 docstring 거의 없음 |
| 아키텍처 문서 | **No** | 시스템 구조 다이어그램 없음 |
| `.gitignore` | **No** | `output/`, `.venv/`, `__pycache__/` 등이 git에 포함될 수 있음 |

#### Code Duplication

| Duplicated Code | Files | Lines | Notes |
|----------------|-------|-------|-------|
| MQTT 상수 (`MQTT_HOST`, `MQTT_PORT`, `MQTT_TOPIC`) | 5개 파일 모두 | ~3 lines × 5 | `config.py`로 추출 권장 |
| `normalize_rssi()` | `sniff_and_send.py`, `sniff_and_send_unified.py` | ~20 lines × 2 | 거의 동일한 함수 중복 |
| `safe_append_jsonl()` / `append_jsonl()` | `run_live.py`, `run_live_test.py`, `calibrate_interactive.py`, `accuracy_test_from_zone_assignments.py` | ~5 lines × 4 | 동일 패턴 반복 |
| `load_calibration()` | `run_live.py`, `run_live_test.py` | ~20 lines × 2 | 거의 동일 (미세한 차이만 있음) |
| `avg_diff()` | `run_live.py`, `run_live_test.py` | ~5 lines × 2 | 완전 동일 |
| `ts_kst()` / `now_kst_str()` | 4개 파일 | ~3 lines × 4 | 동일 기능, 함수명만 다름 |

---

## Section 12: Expected Work for Monorepo Migration

### 1. Directory Migration: `apps/neuralsense/`

```
# Before (standalone)
neuralsense/
├── run_live.py
├── calibrate_interactive.py
├── ...
└── neuralsense_pi/

# After (in monorepo)
monorepo/
├── apps/
│   └── neuralsense/
│       ├── run_live.py
│       ├── calibrate_interactive.py
│       ├── requirements.txt
│       ├── zones.csv
│       └── neuralsense_pi/
│           ├── requirements.txt
│           └── ...
├── packages/
│   └── shared-schemas/
│       └── neuralsense/
│           ├── mqtt_payload.schema.json
│           └── zone_assignment.schema.json
└── ...
```

**작업 내용:**
- Git history를 보존하며 `apps/neuralsense/`로 이동 (`git mv` 또는 `git filter-repo`)
- 상대 경로 참조 (`zones.csv`, `output/`) 확인 및 수정
- `.gitignore` 생성: `output/`, `accuracy_tests/`, `.venv/`, `__pycache__/`

### 2. Dependency Management Integration

| Task | Details | Effort |
|------|---------|--------|
| `requirements.txt` 유지 | 현재 구조 그대로 `apps/neuralsense/` 하위에 보존 | 없음 (그대로) |
| Poetry 마이그레이션 (선택) | `pyproject.toml` 생성, `poetry.lock`으로 전환 | 약 30분 |
| Root-level 스크립트 | `Makefile` 또는 Turborepo pipeline에 `pip install` 명령 추가 | 약 30분 |
| Python 버전 고정 | `.python-version` 파일 추가 (pyenv 호환) | 5분 |

### 3. Shared Schema/Type Extraction

| Task | Details | Effort |
|------|---------|--------|
| MQTT Payload JSON Schema 작성 | `{"ts": number, "rpi_id": string, "mac": string, "rssi": integer}` | 약 15분 |
| JSONL File Schemas 작성 | 6종의 출력 파일 스키마 정의 | 약 1시간 |
| TypeScript 타입 자동 생성 | `json-schema-to-typescript` 파이프라인 구축 | 약 30분 |
| Python dataclass/Pydantic 모델 | 스키마에서 Python 모델 자동 생성 (선택) | 약 1시간 |

### 4. CI/CD Integration

| Task | Details | Effort |
|------|---------|--------|
| GitHub Actions workflow 생성 | Python lint (flake8/ruff) + type check (mypy) | 약 1시간 |
| Unit test 작성 | `avg_diff()`, `normalize_rssi()`, `load_calibration()` 등 핵심 함수 | 약 2-3시간 |
| MQTT integration test | 로컬 Mosquitto 컨테이너로 pub/sub 테스트 | 약 2시간 |
| Pre-commit hooks | `ruff`, `mypy`, `black` 설정 | 약 30분 |

### 5. Expected Time Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|---------------|
| **Phase 1: 기본 이동** | 디렉토리 이동, `.gitignore` 추가, 경로 수정 | **1-2시간** |
| **Phase 2: 코드 정리** | 중복 코드 추출 (`config.py`, `utils.py`), paho-mqtt v2 API 마이그레이션 | **2-3시간** |
| **Phase 3: 스키마 추출** | JSON Schema 작성, TypeScript 타입 생성 파이프라인 | **2-3시간** |
| **Phase 4: CI/CD** | GitHub Actions, lint, unit test 기본 세트 | **3-4시간** |
| **Phase 5: 문서화** | README.md, 아키텍처 다이어그램, 설치 가이드 | **1-2시간** |
| **총 예상** | | **9-14시간** (1.5-2일) |

> **Phase 1만으로도 모노레포 통합은 완료**됨. Phase 2-5는 코드 품질 향상을 위한 선택적 작업이며, 우선순위에 따라 점진적으로 진행 가능.
