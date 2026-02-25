import { SchemaMetadata } from '@/hooks/useSchemaMetadata';

export interface DependencyGraph {
  [table: string]: string[];
}

export function buildDependencyGraph(schema: SchemaMetadata): DependencyGraph {
  const graph: DependencyGraph = {};
  
  for (const [tableName, tableMetadata] of Object.entries(schema)) {
    graph[tableName] = tableMetadata.foreign_keys
      .map(fk => fk.foreign_table)
      .filter(refTable => refTable !== tableName); // 자기 참조 제외
  }
  
  return graph;
}

export function calculateUploadOrder(
  schema: SchemaMetadata,
  tableFiles: Record<string, string[]>
): string[][] {
  const tables = Object.keys(tableFiles);
  const graph: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  // 그래프 초기화
  for (const table of tables) {
    graph[table] = [];
    inDegree[table] = 0;
  }

  // FK 관계에 따라 간선 추가
  for (const table of tables) {
    const tableSchema = schema[table];
    if (!tableSchema) continue;

    for (const fk of tableSchema.foreign_keys) {
      const refTable = fk.foreign_table;
      if (tables.includes(refTable) && refTable !== table) {
        graph[refTable].push(table);
        inDegree[table]++;
      }
    }
  }

  // 위상 정렬 (Kahn's Algorithm)
  const result: string[][] = [];
  const queue: string[] = [];

  // 진입 차수가 0인 노드를 큐에 추가
  for (const table of tables) {
    if (inDegree[table] === 0) {
      queue.push(table);
    }
  }

  while (queue.length > 0) {
    const currentLevel: string[] = [...queue];
    queue.length = 0;
    const levelFiles: string[] = [];

    for (const table of currentLevel) {
      levelFiles.push(...tableFiles[table]);
      for (const neighbor of graph[table]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    result.push(levelFiles);
  }

  // 순환 참조가 있는 경우 마지막에 추가
  const remaining = tables.filter(t => inDegree[t] > 0);
  if (remaining.length > 0) {
    const remainingFiles = remaining.flatMap(t => tableFiles[t]);
    result.push(remainingFiles);
  }

  return result;
}

export function getTablesByLevel(
  schema: SchemaMetadata,
  tables: string[]
): Map<number, string[]> {
  const graph: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  // 초기화
  for (const table of tables) {
    graph[table] = [];
    inDegree[table] = 0;
  }

  // FK 관계 구축
  for (const table of tables) {
    const tableSchema = schema[table];
    if (!tableSchema) continue;

    for (const fk of tableSchema.foreign_keys) {
      const refTable = fk.foreign_table;
      if (tables.includes(refTable) && refTable !== table) {
        graph[refTable].push(table);
        inDegree[table]++;
      }
    }
  }

  // 위상 정렬로 레벨 계산
  const levels = new Map<number, string[]>();
  const queue: string[] = [];
  let level = 0;

  for (const table of tables) {
    if (inDegree[table] === 0) {
      queue.push(table);
    }
  }

  while (queue.length > 0) {
    const currentLevel: string[] = [...queue];
    queue.length = 0;
    levels.set(level, currentLevel);

    for (const table of currentLevel) {
      for (const neighbor of graph[table]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    level++;
  }

  return levels;
}

export function groupFilesByTable(files: Array<{ fileName: string; tableName: string }>): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  for (const file of files) {
    if (!grouped[file.tableName]) {
      grouped[file.tableName] = [];
    }
    grouped[file.tableName].push(file.fileName);
  }
  
  return grouped;
}

export function checkCanUpload(
  tableName: string,
  schema: SchemaMetadata,
  uploadedTables: Set<string>
): { canUpload: boolean; missingDependencies: string[] } {
  const tableSchema = schema[tableName];
  if (!tableSchema) {
    return { canUpload: false, missingDependencies: [] };
  }

  const missingDependencies: string[] = [];
  
  for (const fk of tableSchema.foreign_keys) {
    const refTable = fk.foreign_table;
    if (refTable !== tableName && !uploadedTables.has(refTable)) {
      missingDependencies.push(refTable);
    }
  }

  return {
    canUpload: missingDependencies.length === 0,
    missingDependencies
  };
}

export function getNextUploadableTables(
  schema: SchemaMetadata,
  remainingTables: string[],
  uploadedTables: Set<string>
): string[] {
  return remainingTables.filter(table => {
    const { canUpload } = checkCanUpload(table, schema, uploadedTables);
    return canUpload;
  });
}
