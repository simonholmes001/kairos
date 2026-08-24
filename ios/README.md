# KAIROS iOS

This path will hold the SwiftUI operator application.

The iOS app is the only human-facing MVP application. It may store safe local presentation state and read-only cached snapshots, but it cannot run agents, access provider secrets, bypass risk controls, approve trades offline, or mutate authoritative trading state without Azure confirmation.

## Validation

Run:

```bash
swift test --package-path ios/KairosApp
```
