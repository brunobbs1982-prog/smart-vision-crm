'use client';

import { useState } from 'react';
import { useCrmStore } from '@/store/useCrmStore';
import { OPERATIONS } from '@/constants/operations';
import { formatCurrency, generateId } from '@/lib/utils';
import { toast } from '@/lib/toast';
import type { OperationUnitCode, ProductCatalogItem } from '@/types/crm.types';

export function ProductsCatalogView() {
  const products = useCrmStore((s) => s.products);
  const [name, setName] = useState('');
  const [operation, setOperation] = useState<OperationUnitCode>('OP1');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');

  function addProduct() {
    if (!name.trim()) {
      toast('Informe o nome do produto', 'error');
      return;
    }
    const item: ProductCatalogItem = {
      id: generateId('prod'),
      name: name.trim(),
      operation,
      price: Number(price) || 0,
      description: description.trim(),
    };
    useCrmStore.setState((s) => ({ products: [...s.products, item] }));
    setName('');
    setPrice(0);
    setDescription('');
    toast('Produto adicionado', 'success');
  }

  function removeProduct(id: string) {
    useCrmStore.setState((s) => ({ products: s.products.filter((p) => p.id !== id) }));
    toast('Produto removido', 'info');
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-heading font-bold text-[#032D60]">Catálogo de produtos</h1>
          <p className="text-sm text-slate-500">Soluções por unidade operacional</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">Novo item</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              value={operation}
              onChange={(e) => setOperation(e.target.value as OperationUnitCode)}
            >
              {OPERATIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.shortName}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-metric"
              placeholder="Preço"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <input
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button onClick={addProduct} className="btn-primary text-sm">
            Adicionar
          </button>
        </div>

        <div className="space-y-2">
          {products.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-10 border border-dashed border-slate-200 rounded-xl">
              Nenhum produto no catálogo
            </div>
          )}
          {products.map((p) => {
            const op = OPERATIONS.find((o) => o.code === p.operation);
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {op?.shortName} · {formatCurrency(p.price)}
                  </div>
                  {p.description && (
                    <div className="text-xs text-slate-500 mt-1">{p.description}</div>
                  )}
                </div>
                <button
                  onClick={() => removeProduct(p.id)}
                  className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
