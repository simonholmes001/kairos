import Foundation
import Testing
@testable import KairosApp

@Suite("Phone/cloud boundary policy")
struct PhoneCloudBoundaryTests {
    private let policy = PhoneCloudBoundaryPolicy()

    @Test("read-only and draft actions are allowed while offline")
    func readOnlyActionsAreAllowedOffline() {
        #expect(policy.canPerform(.viewPortfolioSnapshot, backendReachable: false))
        #expect(policy.canPerform(.viewDecisionExplanation, backendReachable: false))
        #expect(policy.canPerform(.draftScenario, backendReachable: false))
    }

    @Test("authoritative trading and safety actions require backend reachability")
    func authoritativeActionsRequireBackend() {
        let actions: [KairosOperatorAction] = [
            .approveTrade,
            .rejectTrade,
            .changeAutonomyLevel,
            .activateKillSwitch,
            .deactivateKillSwitch,
            .placeOrder,
            .cancelOrder
        ]

        for action in actions {
            #expect(policy.requiresAzureAuthority(action))
            #expect(!policy.canPerform(action, backendReachable: false))
            #expect(policy.canPerform(action, backendReachable: true))
        }
    }

    @Test("stale read snapshots are detectable")
    func staleSnapshotsAreDetectable() {
        let now = Date(timeIntervalSince1970: 1_000)
        let snapshot = KairosReadSnapshot(
            authority: .phoneCache,
            capturedAt: Date(timeIntervalSince1970: 800),
            receivedAt: Date(timeIntervalSince1970: 900)
        )

        #expect(!snapshot.isStale(comparedTo: now, maxAge: 120))
        #expect(snapshot.isStale(comparedTo: now, maxAge: 60))
    }
}
