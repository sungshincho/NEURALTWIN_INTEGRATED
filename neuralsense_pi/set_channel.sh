#!/bin/bash
CHANNEL=$1
WLAN=$2

sudo ifconfig $WLAN down
sudo iwconfig $WLAN mode monitor
sudo ifconfig $WLAN up
sudo iwconfig $WLAN channel $CHANNEL
iwconfig $WLAN

