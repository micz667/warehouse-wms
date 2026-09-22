-- AlterEnum: daily movement kinds for F006 prove seeds (F007 scan UI later)
ALTER TYPE "MovementType" ADD VALUE 'receipt';
ALTER TYPE "MovementType" ADD VALUE 'issue';
ALTER TYPE "MovementType" ADD VALUE 'transfer';
