'use server';

import { sql } from "@vercel/postgres";
import { revalidatePath } from 'next/cache';
import { redirect } from "next/navigation";
import { z } from 'zod';



const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({invalid_type_error:'Please select a customer.'}),
    amount: z.coerce
        .number()
        .gt(0,{message:'Please enter an amount greter than 0.'}),
    status: z.enum(['pending', 'paid'],{invalid_type_error:'Please select an invoice status'}),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(formData: FormData) {
    const verifiedform = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: Number(formData.get('amount')),
        status: formData.get('status'),
    })
    if (!verifiedform.success) {
        return verifiedform.error;
    }
    const { customerId, amount, status } = verifiedform.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
        INSERT INTO invoices (customer_id,amount,status,date) 
        VALUES (${customerId},${amountInCents},${status},${date})
        `;
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Invoice.',
          };
    }


    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
    const verifiedform = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: Number(formData.get('amount')),
        status: formData.get('status'),
    })
    if (!verifiedform.success) {
        return verifiedform.error;
    }
    const { customerId, amount, status } = verifiedform.data;    
    const amountInCents = amount * 100;

    try {
        await sql`
        Update invoices 
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
        `
    } catch (error) {
        return {
            message: 'Database Error: Failed to Update  Invoice.',
          };
    }


    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
        await sql`
        delete from invoices where id=${id}
        `
    } catch (error) {
        return {
            message: 'Database Error: Failed to Delete  Invoice.',
          };
    }
    revalidatePath('/dashboard/invoices');
}