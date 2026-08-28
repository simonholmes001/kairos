targetScope = 'subscription'

@description('Deployment environment name.')
@allowed([
  'dev'
])
param environment string = 'dev'

@description('Azure region for the Kairos resource group.')
param location string = 'swedencentral'

@description('Short workload name used in resource names.')
param workloadName string = 'kairos'

@description('Owner email or alias for cost and operations tags.')
param owner string

var resourceGroupName = 'rg-${workloadName}-${environment}'
var commonTags = {
  workload: workloadName
  environment: environment
  owner: owner
  costCenter: workloadName
  dataTier: 'confidential'
  shutdownPolicy: 'scale-to-zero-or-manual'
  managedBy: 'bicep'
}

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: commonTags
}

output resourceGroupName string = rg.name
