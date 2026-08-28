targetScope = 'subscription'

@description('The single Kairos deployment environment.')
@allowed([
  'dev'
])
param environment string = 'dev'

@description('Azure region for regional resources.')
param location string = 'swedencentral'

@description('Short workload name used in resource names.')
param workloadName string = 'kairos'

@description('Owner email or alias for cost and operations tags.')
param owner string

@description('Monthly Azure budget amount for the platform resource group.')
@minValue(1)
param monthlyBudgetAmount int = 50

@description('Email recipients for Azure budget notifications.')
param budgetAlertEmails array

@description('Timestamp when the monthly budget starts.')
param budgetStartDate string

var normalized = toLower('${workloadName}-${environment}')
var commonTags = {
  workload: workloadName
  environment: environment
  owner: owner
  costCenter: workloadName
  dataTier: 'confidential'
  shutdownPolicy: 'scale-to-zero-or-manual'
  managedBy: 'bicep'
}

resource networkResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-${normalized}-network'
  location: location
  tags: union(commonTags, {
    resourceBoundary: 'network'
  })
}

resource platformResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-${normalized}-platform'
  location: location
  tags: union(commonTags, {
    resourceBoundary: 'platform'
  })
}

module platform 'platform.bicep' = {
  name: 'kairos-${environment}-platform'
  scope: platformResourceGroup
  // The explicit dependency documents the bootstrap ordering required for a fresh subscription.
  #disable-next-line no-unnecessary-dependson
  dependsOn: [
    #disable-next-line no-unnecessary-dependson
    platformResourceGroup
  ]
  params: {
    environment: environment
    location: location
    workloadName: workloadName
    owner: owner
    monthlyBudgetAmount: monthlyBudgetAmount
    budgetAlertEmails: budgetAlertEmails
    budgetStartDate: budgetStartDate
  }
}

module network 'network.bicep' = {
  name: 'kairos-${environment}-network'
  scope: networkResourceGroup
  // The explicit dependency documents both target-RG creation and platform output ordering.
  #disable-next-line no-unnecessary-dependson
  dependsOn: [
    #disable-next-line no-unnecessary-dependson
    networkResourceGroup
    #disable-next-line no-unnecessary-dependson
    platform
  ]
  params: {
    environment: environment
    location: location
    workloadName: workloadName
    owner: owner
    storageResourceId: platform.outputs.storageResourceId
    keyVaultResourceId: platform.outputs.keyVaultResourceId
  }
}

output networkResourceGroupName string = networkResourceGroup.name
output platformResourceGroupName string = platformResourceGroup.name
output workloadIdentityClientId string = platform.outputs.workloadIdentityClientId
output storageAccountName string = platform.outputs.storageAccountName
output keyVaultName string = platform.outputs.keyVaultName
