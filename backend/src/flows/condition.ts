type LogicalOperator = 'and' | 'or';
type ComparisonOperator = 'equals' | 'greater_than' | 'less_than'; // extend as needed

type ComparisonCondition = {
  type: 'condition';
  leftOperand: string;
  operator: ComparisonOperator;
  rightOperand: string | number | boolean;
};

type LogicalGroup = {
  type: 'group';
  logicalOperator: LogicalOperator;
  conditions: Expression[];
};

export type Expression = ComparisonCondition | LogicalGroup;
