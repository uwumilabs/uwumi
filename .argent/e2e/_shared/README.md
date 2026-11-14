# Shared fragments

`start-android.yaml` and `start-ios.yaml` cold-start uwumi on the Anime tab: `launch` (the dev client opens on its launcher), then `open-url` with the dev URL so the bundle loads from Metro at 127.0.0.1:8081, then wait for `anime-screen` and idle. Every test runs one first with `- run: ../_shared/start-<platform>.yaml`, so tests don't depend on each other.

Needs Metro running, and on Android `adb reverse tcp:8081 tcp:8081` for the device. A cold load from Metro can take up to a minute after Metro restarts, which the 90 s wait covers.
