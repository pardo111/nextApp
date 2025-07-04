'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: {
    rejectUnauthorized: false,
  },
});


export async function deleteInvoice(id: string) {

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    console.log(error);
  }
  revalidatePath('/dashboard/invoices');
};

const UpdateInvoice = FormSchema.omit({ id: true, date: true });


const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {

  try {
   
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `; 
  } catch (error) {
        console.log(error);

  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}


export async function createInvoice(formData: FormData) {
  try {
    const { customerId, amount, status } = CreateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: Number(formData.get('amount')), // asegúrate que sea número
      status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;


  } catch (err) {
    console.error(err);

  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}