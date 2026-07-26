export interface VpcSelection {
  vpcId: string
  subnetIds: string[]
  securityGroupIds: string[]
}

export type VpcResourceType = 'ec2' | 'rds' | 'elasticache' | 'msk' | 'opensearch' | 'lambda'
