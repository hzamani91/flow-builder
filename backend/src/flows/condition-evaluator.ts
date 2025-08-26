type LogicalOperator = 'and' | 'or' | 'not';
type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equals'
  | 'less_or_equals'
  | 'contains';

interface GroupCondition {
  type: 'group';
  logicalOperator: LogicalOperator;
  conditions?: Expression[]; // for and/or
  operand?: Expression; // for not
}

interface ComparisonCondition {
  type: 'comparison';
  lhs: string | number | boolean;
  op: ComparisonOperator;
  rhs: string | number | boolean;
}

type Expression = string | GroupCondition | ComparisonCondition | Expression[];

export class ConditionEvaluator {
  private operators: Record<ComparisonOperator, (a: any, b: any) => boolean> = {
    equals: (a, b) => a === b,
    not_equals: (a, b) => a !== b,
    greater_than: (a, b) => a > b,
    less_than: (a, b) => a < b,
    greater_or_equals: (a, b) => a >= b,
    less_or_equals: (a, b) => a <= b,
    contains: (a, b) => typeof a === 'string' && a.includes(b),
  };

  evaluate(condition: Expression, inputData: any): boolean {
    if (typeof condition === 'string') {
      throw new Error(
        'String conditions are no longer supported for security reasons.',
      );
    }

    if (Array.isArray(condition)) {
      // Default: AND for arrays
      return condition.every((c) => this.evaluate(c, inputData));
    }

    if (condition.type === 'group') {
      return this.evaluateGroup(condition, inputData);
    }

    if (condition.type === 'comparison') {
      return this.evaluateComparison(condition, inputData);
    }

    throw new Error('Invalid condition format.');
  }

  private evaluateGroup(group: GroupCondition, inputData: any): boolean {
    const { logicalOperator, conditions, operand } = group;
    switch (logicalOperator) {
      case 'and':
        if (!conditions) throw new Error("'and' requires conditions array.");
        return conditions.every((c) => this.evaluate(c, inputData));
      case 'or':
        if (!conditions) throw new Error("'or' requires conditions array.");
        return conditions.some((c) => this.evaluate(c, inputData));
      case 'not':
        if (!operand) throw new Error("'not' requires operand.");
        return !this.evaluate(operand, inputData);
      default:
        throw new Error(`Unsupported logical operator: ${logicalOperator}`);
    }
  }

  private evaluateComparison(
    cond: ComparisonCondition,
    inputData: any,
  ): boolean {
    const { lhs, rhs, op } = cond;
    const operatorFn = this.operators[op];
    if (!operatorFn) {
      throw new Error(`Unsupported comparison operator: ${op}`);
    }

    const lhsVal = this.resolveValue(lhs, inputData);
    const rhsVal = this.resolveValue(rhs, inputData);

    return operatorFn(lhsVal, rhsVal);
  }

  private resolveValue(val: any, inputData: any): any {
    if (typeof val === 'string' && val.includes('.')) {
      return val.split('.').reduce((acc, key) => acc?.[key], inputData);
    }
    if (typeof val === 'string' && val in inputData) {
      return inputData[val];
    }
    return val;
  }

  public registerOperator(name: string, fn: (a: any, b: any) => boolean): void {
    this.operators[name as ComparisonOperator] = fn;
  }
}
