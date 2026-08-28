targetScope = 'resourceGroup'

@description('The single Kairos deployment environment.')
@allowed([
  'dev'
])
param environment string = 'dev'

param location string = resourceGroup().location
param workloadName string = 'kairos'
param owner string
param storageResourceId string
param keyVaultResourceId string

var normalized = toLower('${workloadName}-${environment}')
var commonTags = {
  workload: workloadName
  environment: environment
  owner: owner
  costCenter: workloadName
  dataTier: 'confidential'
  shutdownPolicy: 'scale-to-zero-or-manual'
  managedBy: 'bicep'
  resourceBoundary: 'network'
}
var vnetName = 'vnet-${normalized}'
var privateEndpointSubnetName = 'snet-private-endpoints'

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: vnetName
  location: location
  tags: commonTags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.42.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'snet-runtime'
        properties: {
          addressPrefix: '10.42.1.0/24'
          privateEndpointNetworkPolicies: 'Enabled'
        }
      }
      {
        name: privateEndpointSubnetName
        properties: {
          addressPrefix: '10.42.2.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

resource privateEndpointSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: privateEndpointSubnetName
}

resource blobPrivateDns 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  #disable-next-line no-hardcoded-env-urls
  name: 'privatelink.blob.core.windows.net'
  location: 'global'
  tags: commonTags
}

resource dfsPrivateDns 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  #disable-next-line no-hardcoded-env-urls
  name: 'privatelink.dfs.core.windows.net'
  location: 'global'
  tags: commonTags
}

resource queuePrivateDns 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  #disable-next-line no-hardcoded-env-urls
  name: 'privatelink.queue.core.windows.net'
  location: 'global'
  tags: commonTags
}

resource vaultPrivateDns 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.vaultcore.azure.net'
  location: 'global'
  tags: commonTags
}

resource blobDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: blobPrivateDns
  name: 'link-${vnetName}'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource dfsDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: dfsPrivateDns
  name: 'link-${vnetName}'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource queueDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: queuePrivateDns
  name: 'link-${vnetName}'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource vaultDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: vaultPrivateDns
  name: 'link-${vnetName}'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

var privateEndpoints = [
  {
    name: 'storage-blob'
    groupId: 'blob'
    serviceId: storageResourceId
    dnsZoneId: blobPrivateDns.id
    dnsName: 'blob'
    linkName: blobDnsLink.name
  }
  {
    name: 'storage-dfs'
    groupId: 'dfs'
    serviceId: storageResourceId
    dnsZoneId: dfsPrivateDns.id
    dnsName: 'dfs'
    linkName: dfsDnsLink.name
  }
  {
    name: 'storage-queue'
    groupId: 'queue'
    serviceId: storageResourceId
    dnsZoneId: queuePrivateDns.id
    dnsName: 'queue'
    linkName: queueDnsLink.name
  }
  {
    name: 'key-vault'
    groupId: 'vault'
    serviceId: keyVaultResourceId
    dnsZoneId: vaultPrivateDns.id
    dnsName: 'vault'
    linkName: vaultDnsLink.name
  }
]

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-11-01' = [for endpoint in privateEndpoints: {
  name: 'pe-${endpoint.name}-${normalized}'
  location: location
  tags: commonTags
  properties: {
    subnet: {
      id: privateEndpointSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: endpoint.name
        properties: {
          privateLinkServiceId: endpoint.serviceId
          groupIds: [
            endpoint.groupId
          ]
        }
      }
    ]
  }
}]

resource dnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = [for (endpoint, index) in privateEndpoints: {
  parent: privateEndpoint[index]
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: endpoint.dnsName
        properties: {
          privateDnsZoneId: endpoint.dnsZoneId
        }
      }
    ]
  }
}]

output virtualNetworkId string = vnet.id
output virtualNetworkName string = vnet.name
