using '../main.bicep'

param environment = 'dev'
param location = 'swedencentral'
param workloadName = 'kairos'
param owner = 'simonholmes001'
param monthlyBudgetAmount = 50
param budgetAlertEmails = [
  'simonholmes001@users.noreply.github.com'
]
param budgetStartDate = '2026-08-01T00:00:00Z'
