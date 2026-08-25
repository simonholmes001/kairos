import Foundation

public enum KairosAuthority: Equatable, Sendable {
    case phoneCache
    case azureAuthoritative
}

public enum KairosOperatorAction: Equatable, Sendable {
    case viewPortfolioSnapshot
    case viewDecisionExplanation
    case draftScenario
    case approveTrade
    case rejectTrade
    case changeAutonomyLevel
    case activateKillSwitch
    case deactivateKillSwitch
    case placeOrder
    case cancelOrder
}

public struct KairosReadSnapshot: Equatable, Sendable {
    public let authority: KairosAuthority
    public let capturedAt: Date
    public let receivedAt: Date

    public init(authority: KairosAuthority, capturedAt: Date, receivedAt: Date) {
        self.authority = authority
        self.capturedAt = capturedAt
        self.receivedAt = receivedAt
    }

    public func isStale(comparedTo now: Date, maxAge: TimeInterval) -> Bool {
        now.timeIntervalSince(receivedAt) > maxAge
    }
}

public struct PhoneCloudBoundaryPolicy: Sendable {
    public init() {}

    public func canPerform(_ action: KairosOperatorAction, backendReachable: Bool) -> Bool {
        switch action {
        case .viewPortfolioSnapshot, .viewDecisionExplanation, .draftScenario:
            return true
        case .approveTrade,
             .rejectTrade,
             .changeAutonomyLevel,
             .activateKillSwitch,
             .deactivateKillSwitch,
             .placeOrder,
             .cancelOrder:
            return backendReachable
        }
    }

    public func requiresAzureAuthority(_ action: KairosOperatorAction) -> Bool {
        !canPerform(action, backendReachable: false)
    }
}
