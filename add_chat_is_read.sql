-- SQL Migration to add read/seen status to chat messages
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Enable real-time updates for the chat_messages table to broadcast read status instantly
alter publication supabase_realtime add table chat_messages;
