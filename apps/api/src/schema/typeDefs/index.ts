const baseTypeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  type Query {
    me: User
    vms: [VM!]!
    adminOverview: AdminOverview!
    services(userId: String): [Service!]!
    service(id: String!): Service
    servers: [ProxmoxNode!]!
    domains: [PlatformDomain!]!
    vmStats(vmId: String!): VmStats
    auditLogs(limit: Int, offset: Int): [AuditLog!]!
    users(limit: Int, offset: Int): [User!]!
    coupons: [Coupon!]!
    apiTokens: [ApiToken!]!
    plans: [Plan!]!
  }

  type Mutation {
    createService(input: CreateServiceInput!): Service!
    deleteService(id: String!): Boolean!
    updateService(id: String!, input: UpdateServiceInput!): Service!
    deployService(serviceId: String!): Deployment!
    stopContainer(serviceId: String!, containerId: String!): Container!
    restartContainer(serviceId: String!, containerId: String!): Container!
    setEnvVars(serviceId: String!, containerId: String, vars: JSON!): Boolean!

    addProxmoxNode(input: AddProxmoxNodeInput!): ProxmoxNode!
    removeProxmoxNode(id: String!): Boolean!
    provisionVm(serverId: String!, vmName: String!): VM!

    addDomain(input: AddDomainInput!): PlatformDomain!
    removeDomain(id: String!): Boolean!
    setDomainDefault(id: String!): PlatformDomain!

    createCheckoutSession(planId: String!): CheckoutSessionResult!
    createCustomerPortalSession: CustomerPortalResult!
    cancelSubscription: Boolean!
    downgradeToFree(serviceId: String!): Service!
    upgradeStorage(additionalGb: Int!): Boolean!
    createCoupon(input: CreateCouponInput!): Coupon!
    deactivateCoupon(id: String!): Coupon!
    deleteCoupon(id: String!): Boolean!
    applyCoupon(code: String!): Boolean!

    suspendUser(id: String!): User!
    unsuspendUser(id: String!): User!
    deleteUser(id: String!): Boolean!

    generateApiToken(name: String!): ApiTokenResult!
    revokeApiToken(id: String!): Boolean!
  }

  type Subscription {
    containerLogs(serviceId: String!, containerId: String!): LogLine!
    deploymentStatus(jobId: String!): DeploymentEvent!
  }

  type User {
    id: String!
    name: String!
    email: String!
    emailVerified: Boolean!
    image: String
    role: String!
    suspended: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    serviceCount: Int!
    services: [Service!]
    subscription: Subscription_
  }

  type Subscription_ {
    id: String!
    planId: String!
    plan: Plan
    status: String!
    stripeCustomerId: String
    extraStorageGb: Int!
    currentPeriodEnd: DateTime
  }

  type AdminOverview {
    totalUsers: Int!
    totalServices: Int!
    totalServers: Int!
    totalVms: Int!
    activeServices: Int!
    mrr: Int!
  }

  type Service {
    id: String!
    userId: String!
    name: String!
    subdomain: String!
    sourceType: String!
    gitUrl: String
    branch: String!
    dockerImage: String
    status: String!
    publicUrl: String
    dashboardUrl: String
    envVars: JSON
    containers: [Container!]!
    deployments: [Deployment!]!
    customDomains: [CustomDomain!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Container {
    id: String!
    serviceId: String!
    type: String!
    name: String!
    subdomain: String
    status: String!
    dockerContainerId: String
    internalPort: Int
    externalPort: Int
    envVars: JSON
    resourceLimits: JSON
    createdAt: DateTime!
  }

  type Deployment {
    id: String!
    serviceId: String!
    commitSha: String
    commitMessage: String
    status: String!
    buildLogs: String
    errorMessage: String
    startedAt: DateTime
    completedAt: DateTime
    createdAt: DateTime!
  }

  type ProxmoxNode {
    id: String!
    name: String!
    hostname: String!
    port: Int!
    region: String!
    status: String!
    maxVms: Int!
    metadata: JSON
    vmCount: Int!
    createdAt: DateTime!
  }

  type VM {
    id: String!
    serverId: String!
    name: String!
    ipAddress: String
    status: String!
    cpuCores: Int!
    memoryMb: Int!
    diskGb: Int!
    containerCount: Int!
    createdAt: DateTime!
  }

  type VmStats {
    vmId: String!
    cpuUsage: Float!
    memoryUsedMb: Int!
    memoryTotalMb: Int!
    diskUsedGb: Int!
    diskTotalGb: Int!
    containerCount: Int!
    uptime: Int!
  }

  type PlatformDomain {
    id: String!
    domain: String!
    isDefault: Boolean!
    serviceCount: Int!
    createdAt: DateTime!
  }

  type CustomDomain {
    id: String!
    domain: String!
    isVerified: Boolean!
    sslStatus: String!
    verificationToken: String
    createdAt: DateTime!
  }

  type Plan {
    id: String!
    name: String!
    diskGb: Int!
    maxServices: Int!
    priceMonthPence: Int!
    isActive: Boolean!
  }

  type Coupon {
    id: String!
    code: String!
    type: String!
    amount: Int!
    currency: String
    expiresAt: DateTime
    maxRedemptions: Int
    timesRedeemed: Int!
    isActive: Boolean!
    createdAt: DateTime!
  }

  type AuditLog {
    id: String!
    actorId: String
    actorType: String!
    action: String!
    resourceType: String!
    resourceId: String
    metadata: JSON
    ipAddress: String
    createdAt: DateTime!
  }

  type LogLine {
    timestamp: String!
    message: String!
    stream: String!
    containerId: String!
  }

  type DeploymentEvent {
    jobId: String!
    status: String!
    message: String!
    timestamp: String!
    progress: Float
  }

  type CheckoutSessionResult {
    url: String!
    sessionId: String!
  }

  type CustomerPortalResult {
    url: String!
  }

  type ApiToken {
    id: String!
    name: String!
    lastUsedAt: DateTime
    createdAt: DateTime!
  }

  type ApiTokenResult {
    id: String!
    name: String!
    token: String!
    createdAt: DateTime!
  }

  input CreateServiceInput {
    name: String!
    sourceType: String!
    gitUrl: String
    branch: String
    dockerImage: String
    platformDomainId: String
    customDomain: String
    containers: [CreateContainerInput!]!
    envVars: JSON
  }

  input CreateContainerInput {
    type: String!
    name: String!
    dockerImage: String
    internalPort: Int
    envVars: JSON
    resourceLimits: JSON
  }

  input UpdateServiceInput {
    name: String
    branch: String
    envVars: JSON
  }

  input AddProxmoxNodeInput {
    name: String!
    hostname: String!
    port: Int
    apiTokenId: String!
    apiTokenSecret: String!
    region: String
    maxVms: Int
  }

  input AddDomainInput {
    domain: String!
    cloudflareZoneId: String!
    isDefault: Boolean
  }

  input CreateCouponInput {
    code: String!
    type: String!
    amount: Int!
    currency: String
    expiresAt: DateTime
    maxRedemptions: Int
  }
`;

export const typeDefs = baseTypeDefs;
