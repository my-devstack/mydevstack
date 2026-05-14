import type { Meta, StoryObj } from '@storybook/vue3-vite';
import OpenSearchCodeExamples from './OpenSearchCodeExamples.vue';

const mockExamples = [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: '# List all domains\naws opensearch list-domain-names --region us-east-1\n\n# Describe a domain\naws opensearch describe-domain --domain-name my-domain --region us-east-1\n\n# Create a domain\naws opensearch create-domain --domain-name my-domain --engine-version OpenSearch_2.13 --cluster-config InstanceType=t3.medium.search,InstanceCount=1 --ebs-options EBSEnabled=true,VolumeType=gp2,VolumeSize=10 --region us-east-1\n\n# Delete a domain\naws opensearch delete-domain --domain-name my-domain --region us-east-1\n\n# List tags\naws opensearch list-tags --arn arn:aws:es:us-east-1:123456789012:domain/my-domain --region us-east-1\n\n# Get compatible versions\naws opensearch get-compatible-versions --region us-east-1',
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: '// Using AWS SDK v3\nimport { OpenSearchClient, ListDomainNamesCommand, CreateDomainCommand, DeleteDomainCommand } from "@aws-sdk/client-opensearch";\n\nconst client = new OpenSearchClient({\n  region: \'us-east-1\',\n  endpoint: \'http://127.0.0.1:4566\',\n});\n\nconst listResponse = await client.send(new ListDomainNamesCommand({}));\nconsole.log(listResponse.DomainNames);',
  },
  {
    language: 'python',
    label: 'Python',
    code: 'import boto3\n\nopensearch = boto3.client(\'opensearch\',\n    region_name=\'us-east-1\',\n    endpoint_url=\'http://127.0.0.1:4566\',\n)\n\nresponse = opensearch.list_domain_names()\nfor domain in response[\'DomainNames\']:\n    print(f"Domain: {domain[\'DomainName\']}")',
  },
  {
    language: 'go',
    label: 'Go',
    code: '// Using AWS SDK for Go v2\nimport (\n    "context"\n    "fmt"\n    "github.com/aws/aws-sdk-go-v2/config"\n    "github.com/aws/aws-sdk-go-v2/service/opensearch"\n    "github.com/aws/aws-sdk-go/aws"\n)\n\ncfg, _ := config.LoadDefaultConfig(context.Background(),\n    config.WithRegion("us-east-1"),\n)\n\nclient := opensearch.NewFromConfig(cfg, func(o *opensearch.Options) {\n    o.BaseEndpoint = aws.String("http://127.0.0.1:4566")\n})\n\ndomains, _ := client.ListDomainNames(context.Background(), &opensearch.ListDomainNamesInput{})\nfor _, d := range domains.DomainNames {\n    fmt.Printf("Domain: %s, Engine: %s\\n", aws.ToString(d.DomainName), d.EngineType)\n}',
  },
];

const meta: Meta<typeof OpenSearchCodeExamples> = {
  title: 'Services/OpenSearch/CodeExamples',
  component: OpenSearchCodeExamples,
  tags: ['autodocs'],
  args: { examples: mockExamples },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { examples: mockExamples },
};
