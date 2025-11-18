import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (optional - comment out if you want to preserve data)
  console.log('🧹 Cleaning existing data...');
  await prisma.llMCache.deleteMany();
  await prisma.generationMetric.deleteMany();
  await prisma.documentMetadata.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.generationJob.deleteMany();
  await prisma.templateVersion.deleteMany();
  await prisma.template.deleteMany();
  await prisma.templateCategory.deleteMany();

  // Create template categories
  console.log('📁 Creating template categories...');
  const categories = await Promise.all([
    prisma.templateCategory.create({
      data: {
        name: '融資・資金調達',
        slug: 'financing',
        description: '銀行融資、ベンチャーキャピタル、クラウドファンディングなど',
        icon: '💰',
        sortOrder: 1,
      },
    }),
    prisma.templateCategory.create({
      data: {
        name: '補助金・助成金',
        slug: 'grants',
        description: '政府・自治体の補助金、助成金申請',
        icon: '🏛️',
        sortOrder: 2,
      },
    }),
    prisma.templateCategory.create({
      data: {
        name: '事業計画・提案',
        slug: 'business-plans',
        description: '新規事業提案、事業計画書',
        icon: '📊',
        sortOrder: 3,
      },
    }),
    prisma.templateCategory.create({
      data: {
        name: '契約・法務',
        slug: 'legal',
        description: '契約書、覚書、合意書',
        icon: '📝',
        sortOrder: 4,
      },
    }),
    prisma.templateCategory.create({
      data: {
        name: '報告書',
        slug: 'reports',
        description: '業務報告、プロジェクト報告、進捗報告',
        icon: '📋',
        sortOrder: 5,
      },
    }),
  ]);

  console.log(`✓ Created ${categories.length} categories\n`);

  // Create templates
  console.log('📄 Creating templates...');
  const templates = await Promise.all([
    prisma.template.create({
      data: {
        name: '銀行融資提案書',
        slug: 'bank-loan-proposal',
        version: '1.0.0',
        purpose: '銀行や金融機関に対して、事業資金の融資を依頼するための提案書',
        audience: '銀行の融資担当者、審査部門',
        requiredSections: [
          '企業概要',
          '融資の目的',
          '資金使途',
          '返済計画',
          '事業の強み・実績',
          '市場分析',
          '収支見込み',
          '担保・保証について',
        ],
        tone: '丁寧かつフォーマルな口調。数値データを明確に示し、信頼性を重視する。',
        parameters: [
          {
            name: 'company',
            description: '会社名',
            required: true,
          },
          {
            name: 'amount',
            description: '融資希望額（円）',
            required: true,
          },
          {
            name: 'purpose',
            description: '融資の目的',
            required: true,
            default: '運転資金',
          },
          {
            name: 'business_type',
            description: '事業内容',
            required: true,
          },
          {
            name: 'revenue',
            description: '年間売上高（円）',
            required: false,
          },
          {
            name: 'employees',
            description: '従業員数',
            required: false,
          },
          {
            name: 'years',
            description: '創業年数',
            required: false,
          },
        ],
        additionalInstructions:
          '融資審査に必要な情報を漏れなく記載し、返済の確実性を示す根拠を明確にすること',
        isActive: true,
        isPublic: true,
        categoryId: categories[0].id,
        tags: ['融資', '銀行', '資金調達', '提案書'],
      },
    }),
    prisma.template.create({
      data: {
        name: '補助金申請事業計画書',
        slug: 'government-grant-plan',
        version: '1.0.0',
        purpose: '政府・自治体の補助金や助成金を申請するための事業計画書',
        audience: '補助金審査委員、行政担当者',
        requiredSections: [
          '事業の背景と目的',
          '事業内容',
          '事業の必要性',
          '期待される効果',
          '実施体制',
          'スケジュール',
          '予算計画',
          '事業完了後の展開',
        ],
        tone: '公的文書として適切な表現。社会的意義や公益性を強調し、客観的なデータを重視する。',
        parameters: [
          {
            name: 'company',
            description: '事業者名（企業名・団体名）',
            required: true,
          },
          {
            name: 'project_name',
            description: '事業名',
            required: true,
          },
          {
            name: 'grant_type',
            description: '補助金の種類',
            required: true,
            default: 'ものづくり補助金',
          },
          {
            name: 'budget',
            description: '総事業費（円）',
            required: true,
          },
          {
            name: 'grant_amount',
            description: '補助金申請額（円）',
            required: true,
          },
          {
            name: 'period',
            description: '事業実施期間',
            required: true,
            default: '12ヶ月',
          },
          {
            name: 'industry',
            description: '業種',
            required: false,
          },
        ],
        additionalInstructions:
          '補助金の目的に沿った内容であることを明確にし、事業の革新性や独自性を具体的に説明すること',
        isActive: true,
        isPublic: true,
        categoryId: categories[1].id,
        tags: ['補助金', '助成金', '行政', '申請書'],
      },
    }),
    prisma.template.create({
      data: {
        name: 'スタートアップピッチ資料',
        slug: 'startup-pitch-deck',
        version: '1.0.0',
        purpose: '投資家やVCに対してスタートアップのビジョンと計画を提示する',
        audience: 'ベンチャーキャピタル、エンジェル投資家、アクセラレーター',
        requiredSections: [
          'ビジョン・ミッション',
          '解決する課題',
          'ソリューション',
          '市場規模',
          'ビジネスモデル',
          'トラクション',
          '競合優位性',
          'チーム紹介',
          '資金使途',
          'ロードマップ',
        ],
        tone: '簡潔で説得力のある表現。データドリブンで情熱も感じられるストーリー。',
        parameters: [
          {
            name: 'company',
            description: '会社名',
            required: true,
          },
          {
            name: 'tagline',
            description: 'タグライン（一言で表す価値）',
            required: true,
          },
          {
            name: 'problem',
            description: '解決する課題',
            required: true,
          },
          {
            name: 'solution',
            description: 'ソリューション',
            required: true,
          },
          {
            name: 'market_size',
            description: '市場規模',
            required: true,
          },
          {
            name: 'funding_amount',
            description: '調達希望額（円）',
            required: true,
          },
        ],
        additionalInstructions: 'ビジョンの大きさと実現可能性を両立させ、投資家の関心を引くこと',
        isActive: true,
        isPublic: true,
        categoryId: categories[2].id,
        tags: ['スタートアップ', '投資', 'ピッチ', 'VC'],
      },
    }),
    prisma.template.create({
      data: {
        name: '業務委託契約書',
        slug: 'service-agreement',
        version: '1.0.0',
        purpose: '業務委託に関する契約内容を明確化し、トラブルを未然に防ぐ',
        audience: '委託者、受託者、法務担当者',
        requiredSections: [
          '契約の目的',
          '業務内容',
          '契約期間',
          '報酬',
          '支払条件',
          '知的財産権',
          '秘密保持',
          '損害賠償',
          '契約解除',
          '準拠法・管轄',
        ],
        tone: '法的に正確で明瞭な表現。曖昧さを排除し、権利義務を明確にする。',
        parameters: [
          {
            name: 'client_company',
            description: '委託者（発注側）の会社名',
            required: true,
          },
          {
            name: 'contractor_company',
            description: '受託者（受注側）の会社名',
            required: true,
          },
          {
            name: 'service_description',
            description: '業務内容',
            required: true,
          },
          {
            name: 'contract_period',
            description: '契約期間',
            required: true,
          },
          {
            name: 'compensation',
            description: '報酬額',
            required: true,
          },
        ],
        additionalInstructions: '法的リスクを最小化し、双方の権利義務を明確に定義すること',
        isActive: true,
        isPublic: true,
        categoryId: categories[3].id,
        tags: ['契約書', '業務委託', '法務', 'NDA'],
      },
    }),
    prisma.template.create({
      data: {
        name: '月次業務報告書',
        slug: 'monthly-report',
        version: '1.0.0',
        purpose: '月間の業務成果と進捗を経営層や関係者に報告する',
        audience: '経営層、プロジェクトオーナー、関係部署',
        requiredSections: [
          '報告期間',
          'サマリー',
          '主要な成果',
          '進捗状況',
          '課題と対策',
          '次月の予定',
          'KPI・数値データ',
        ],
        tone: '簡潔で要点を押さえた報告。数値とファクトを重視し、明確な結論を示す。',
        parameters: [
          {
            name: 'department',
            description: '部署名',
            required: true,
          },
          {
            name: 'reporter',
            description: '報告者名',
            required: true,
          },
          {
            name: 'period',
            description: '報告期間',
            required: true,
          },
          {
            name: 'highlights',
            description: '主要成果のハイライト',
            required: false,
          },
        ],
        additionalInstructions: '成果を具体的に示し、課題に対する具体的な対策も併記すること',
        isActive: true,
        isPublic: true,
        categoryId: categories[4].id,
        tags: ['報告書', '月次', '進捗', 'KPI'],
      },
    }),
  ]);

  console.log(`✓ Created ${templates.length} templates\n`);

  // Create sample documents
  console.log('📝 Creating sample documents...');
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        title: '合同会社価作 - 銀行融資提案書（サンプル）',
        templateId: templates[0].id,
        templateSnapshot: {
          name: templates[0].name,
          version: templates[0].version,
        },
        parameters: {
          company: '合同会社価作',
          amount: 8000000,
          purpose: '新規事業立ち上げ資金',
          business_type: 'ソフトウェア開発',
          revenue: 50000000,
          employees: 5,
          years: 3,
        },
        content: '# 銀行融資提案書\n\n（このサンプルは自動生成されたものです）',
        format: 'markdown',
        status: 'APPROVED',
        llmProvider: 'openai',
        llmModel: 'gpt-4o-mini',
        tokenCount: 1500,
        generationTimeMs: 3500,
        cost: 0.05,
        metadata: {
          create: {
            author: 'デモユーザー',
            department: '経営企画部',
            fiscalYear: 2024,
            tags: ['融資', 'サンプル'],
          },
        },
      },
    }),
    prisma.document.create({
      data: {
        title: '補助金申請書（ものづくり補助金）',
        templateId: templates[1].id,
        templateSnapshot: {
          name: templates[1].name,
          version: templates[1].version,
        },
        parameters: {
          company: '株式会社イノベーション',
          project_name: 'AI活用による業務効率化システム開発',
          grant_type: 'ものづくり補助金',
          budget: 10000000,
          grant_amount: 6000000,
          period: '12ヶ月',
          industry: '情報通信業',
        },
        content: '# 補助金申請事業計画書\n\n（このサンプルは自動生成されたものです）',
        format: 'markdown',
        status: 'PENDING_REVIEW',
        llmProvider: 'openai',
        llmModel: 'gpt-4o-mini',
        tokenCount: 2000,
        generationTimeMs: 4200,
        cost: 0.07,
        metadata: {
          create: {
            author: '田中太郎',
            department: '事業開発部',
            fiscalYear: 2024,
            tags: ['補助金', 'AI', 'DX'],
          },
        },
      },
    }),
  ]);

  console.log(`✓ Created ${documents.length} sample documents\n`);

  // Create document versions
  console.log('🔄 Creating document versions...');
  const versions = await Promise.all([
    prisma.documentVersion.create({
      data: {
        documentId: documents[0].id,
        version: 1,
        content: '# 銀行融資提案書（初版）',
        changelog: '初版作成',
        createdBy: 'デモユーザー',
      },
    }),
    prisma.documentVersion.create({
      data: {
        documentId: documents[0].id,
        version: 2,
        content: '# 銀行融資提案書（改訂版）',
        changelog: '財務データを更新',
        createdBy: 'デモユーザー',
      },
    }),
  ]);

  console.log(`✓ Created ${versions.length} document versions\n`);

  // Create generation job
  console.log('⚙️ Creating sample generation job...');
  const job = await prisma.generationJob.create({
    data: {
      name: 'バッチ生成テスト',
      status: 'COMPLETED',
      totalDocuments: 2,
      completedCount: 2,
      failedCount: 0,
      inputData: {
        source: 'csv',
        filename: 'sample-batch.csv',
      },
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(),
    },
  });

  console.log(`✓ Created generation job: ${job.id}\n`);

  // Create metrics
  console.log('📊 Creating sample metrics...');
  const metrics = await Promise.all([
    prisma.generationMetric.create({
      data: {
        metricType: 'generation',
        templateId: templates[0].id,
        documentId: documents[0].id,
        provider: 'openai',
        model: 'gpt-4o-mini',
        tokenCount: 1500,
        cost: 0.05,
        durationMs: 3500,
        success: true,
      },
    }),
    prisma.generationMetric.create({
      data: {
        metricType: 'generation',
        templateId: templates[1].id,
        documentId: documents[1].id,
        provider: 'openai',
        model: 'gpt-4o-mini',
        tokenCount: 2000,
        cost: 0.07,
        durationMs: 4200,
        success: true,
      },
    }),
  ]);

  console.log(`✓ Created ${metrics.length} metrics\n`);

  // Create configuration
  console.log('⚙️ Creating default configuration...');
  await prisma.configuration.createMany({
    data: [
      {
        key: 'default_llm_provider',
        value: 'openai',
        category: 'llm',
      },
      {
        key: 'default_llm_model',
        value: 'gpt-4o-mini',
        category: 'llm',
      },
      {
        key: 'enable_cache',
        value: true,
        category: 'cache',
      },
      {
        key: 'cache_ttl_hours',
        value: 24,
        category: 'cache',
      },
    ],
  });

  console.log('✓ Created default configuration\n');

  console.log('✅ Seed completed successfully!\n');
  console.log('Summary:');
  console.log(`  - ${categories.length} template categories`);
  console.log(`  - ${templates.length} templates`);
  console.log(`  - ${documents.length} sample documents`);
  console.log(`  - ${versions.length} document versions`);
  console.log(`  - 1 generation job`);
  console.log(`  - ${metrics.length} metrics`);
  console.log(`  - 4 configuration entries`);
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
