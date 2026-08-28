targetScope = 'resourceGroup'

@description('The single Kairos deployment environment.')
@allowed([
  'dev'
])
param environment string = 'dev'

param location string = resourceGroup().location
param workloadName string = 'kairos'
param owner string

@minValue(1)
param monthlyBudgetAmount int = 50
param budgetAlertEmails array
param budgetStartDate string

var suffix = uniqueString(resourceGroup().id, workloadName, environment)
var normalized = toLower('${workloadName}-${environment}')
var commonTags = {
  workload: workloadName
  environment: environment
  owner: owner
  costCenter: workloadName
  dataTier: 'confidential'
  shutdownPolicy: 'scale-to-zero-or-manual'
  managedBy: 'bicep'
  resourceBoundary: 'platform'
}

resource workloadIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${normalized}-workload'
  location: location
  tags: commonTags
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'st${replace(normalized, '-', '')}${take(suffix, 6)}'
  location: location
  tags: union(commonTags, {
    purpose: 'provider-data-artifacts-replay'
  })
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    isHnsEnabled: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Disabled'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
    }
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${normalized}-${take(suffix, 6)}'
  location: location
  tags: union(commonTags, {
    purpose: 'provider-model-broker-secrets'
  })
  properties: {
    tenantId: tenant().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    publicNetworkAccess: 'Disabled'
    sku: {
      family: 'A'
      name: 'standard'
    }
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
    }
  }
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-${normalized}'
  location: location
  tags: union(commonTags, {
    purpose: 'observability'
  })
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    workspaceCapping: {
      dailyQuotaGb: 1
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${normalized}'
  location: location
  kind: 'web'
  tags: union(commonTags, {
    purpose: 'application-telemetry'
  })
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Disabled'
    publicNetworkAccessForQuery: 'Disabled'
  }
}

resource monthlyBudget 'Microsoft.Consumption/budgets@2023-11-01' = {
  name: 'budget-${normalized}'
  properties: {
    category: 'Cost'
    amount: monthlyBudgetAmount
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: budgetStartDate
      endDate: '2036-12-31T00:00:00Z'
    }
    notifications: {
      actual80: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        contactEmails: budgetAlertEmails
      }
      forecasted100: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        thresholdType: 'Forecasted'
        contactEmails: budgetAlertEmails
      }
    }
  }
}

output workloadIdentityClientId string = workloadIdentity.properties.clientId
output storageResourceId string = storage.id
output storageAccountName string = storage.name
output keyVaultResourceId string = keyVault.id
output keyVaultName string = keyVault.name
output logAnalyticsWorkspaceName string = logAnalytics.name
output applicationInsightsName string = appInsights.name
