"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema } from "@/domain/dto/product.dto";

type FormValues = z.input<typeof createProductSchema>;

export default function NewProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      currency: "USD",
      stock: 0,
      status: "draft",
      categories: [],
      imageUrls: [],
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        console.error("Failed to create product");
        return;
      }
      reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">New product</h1>
        <p className="text-xs text-slate-400">
          Minimal example form using React Hook Form + Zod against the layered API.
        </p>
      </header>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs"
      >
        <div className="space-y-1">
          <label className="block text-slate-200">Name</label>
          <input
            className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 outline-none"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-[0.7rem] text-rose-400">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="block text-slate-200">Price</label>
          <input
            type="number"
            step="0.01"
            className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 outline-none"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-[0.7rem] text-rose-400">{errors.price.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-9 items-center rounded-full bg-emerald-500 px-4 text-xs font-semibold text-slate-950 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Create product"}
        </button>
      </form>
    </div>
  );
}

