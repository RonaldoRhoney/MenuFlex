// Único e-mail com gerência total da plataforma MenuFlex (todos os negócios, todos os planos).
// Espelhado no banco em is_super_admin() (supabase/migrations/0004_planos_pagos.sql) — a
// checagem que vale de verdade é sempre a do RLS; isto aqui é só pra UI (mostrar/esconder abas).
export const SUPER_ADMIN_EMAIL = 'rhoneyinc@gmail.com'
