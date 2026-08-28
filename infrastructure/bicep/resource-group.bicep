targetScope = 'subscription'

@description('Deployment environment name.')
@allowed([
  'dev'
])
param environment string = 'dev'

@description('Azure region for the Kairos dev resource groups.')
param location string = 'swedencentral'

@description('Short workload name used in resource names.')
param workloadName string = 'kairos'

@description('Owner email or alias for cost and operations tags.')
param owner string

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

resource networkRg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-${normalized}-network'
  location: location
  tags: union(commonTags, {
    resourceBoundary: 'network'
  })
}

resource platformRg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-${normalized}-platform'
  location: location
  tags: union(commonTags, {
    resourceBoundary: 'platform'
  })
}

output networkResourceGroupName string = networkRg.name
output platformResourceGroupName string = platformRg.name
