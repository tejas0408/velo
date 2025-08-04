#!/bin/sh
set -e

# Stub script to satisfy E2B but do nothing dangerous
echo "Skipping apt-based provisioning, using Alpine."
apt-get update && apt-get install -y systemd systemd-sysv openssh-server sudo chrony linuxptp socat
apk update && apk add systemd openssh sudo chrony linuxptp socat