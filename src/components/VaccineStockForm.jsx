import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const VaccineStockForm = ({ vaccine, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    vaccine || {
      name: '',
      manufacturer: '',
      batch: '',
      expiration_date: '',
      quantity: '',
    }
  );

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-effect p-6 rounded-2xl w-full max-w-lg"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {vaccine ? 'Editar Vacina' : 'Adicionar Nova Vacina'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nome da Vacina"
          required
          className="bg-white/50"
        />
        <Input
          name="manufacturer"
          value={formData.manufacturer}
          onChange={handleChange}
          placeholder="Fabricante"
          required
          className="bg-white/50"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="batch"
            value={formData.batch}
            onChange={handleChange}
            placeholder="Lote"
            required
            className="bg-white/50"
          />
          <div>
            <label className="text-xs text-gray-500">Data de Validade</label>
            <Input
              name="expiration_date"
              type="date"
              value={formData.expiration_date}
              onChange={handleChange}
              required
              className="bg-white/50"
            />
          </div>
        </div>
        <Input
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Quantidade"
          required
          className="bg-white/50"
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 medical-gradient text-white">
            Salvar
          </Button>
        </div>
      </form>
    </motion.div>
  );
};