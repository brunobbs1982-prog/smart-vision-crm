import type { OperationUnitCode } from '@/types/crm.types';

export interface OperationUnit {
  code: OperationUnitCode;
  name: string;
  shortName: string;
  description: string;
  color: string;
}

export const OPERATIONS: OperationUnit[] = [
  {
    code: 'OP1',
    name: 'Treinamentos',
    shortName: 'Treinamentos',
    description: 'Programas de capacitação e desenvolvimento comercial',
    color: '#0176D3',
  },
  {
    code: 'OP2',
    name: 'Serviços',
    shortName: 'Serviços',
    description: 'Consultoria e serviços especializados',
    color: '#10B981',
  },
  {
    code: 'OP3',
    name: 'Inovamente',
    shortName: 'Inovamente',
    description: 'Soluções de inovação e transformação digital',
    color: '#8B5CF6',
  },
];

export function getOperation(code: OperationUnitCode): OperationUnit {
  return OPERATIONS.find((o) => o.code === code) ?? OPERATIONS[0];
}
