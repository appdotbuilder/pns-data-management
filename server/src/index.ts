
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema,
  createPegawaiInputSchema, 
  getPegawaiByIdInputSchema,
  createRiwayatJabatanInputSchema,
  createMutasiInputSchema,
  updateMutasiStatusInputSchema,
  createPosisiTersediaInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createPegawai } from './handlers/create_pegawai';
import { getPegawai } from './handlers/get_pegawai';
import { getPegawaiById } from './handlers/get_pegawai_by_id';
import { getPegawaiMendekatiPensiun } from './handlers/get_pegawai_mendekati_pensiun';
import { createRiwayatJabatan } from './handlers/create_riwayat_jabatan';
import { getRiwayatJabatanByPegawai } from './handlers/get_riwayat_jabatan_by_pegawai';
import { createMutasi } from './handlers/create_mutasi';
import { getMutasiPending } from './handlers/get_mutasi_pending';
import { updateMutasiStatus } from './handlers/update_mutasi_status';
import { createPosisiTersedia } from './handlers/create_posisi_tersedia';
import { getPosisiTersedia } from './handlers/get_posisi_tersedia';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Pegawai routes
  createPegawai: publicProcedure
    .input(createPegawaiInputSchema)
    .mutation(({ input }) => createPegawai(input)),
  
  getPegawai: publicProcedure
    .query(() => getPegawai()),
  
  getPegawaiById: publicProcedure
    .input(getPegawaiByIdInputSchema)
    .query(({ input }) => getPegawaiById(input)),
  
  getPegawaiMendekatiPensiun: publicProcedure
    .query(() => getPegawaiMendekatiPensiun()),

  // Riwayat Jabatan routes
  createRiwayatJabatan: publicProcedure
    .input(createRiwayatJabatanInputSchema)
    .mutation(({ input }) => createRiwayatJabatan(input)),
  
  getRiwayatJabatanByPegawai: publicProcedure
    .input(getPegawaiByIdInputSchema)
    .query(({ input }) => getRiwayatJabatanByPegawai(input)),

  // Mutasi routes
  createMutasi: publicProcedure
    .input(createMutasiInputSchema)
    .mutation(({ input }) => createMutasi(input)),
  
  getMutasiPending: publicProcedure
    .query(() => getMutasiPending()),
  
  updateMutasiStatus: publicProcedure
    .input(updateMutasiStatusInputSchema)
    .mutation(({ input }) => updateMutasiStatus(input)),

  // Posisi Tersedia routes
  createPosisiTersedia: publicProcedure
    .input(createPosisiTersediaInputSchema)
    .mutation(({ input }) => createPosisiTersedia(input)),
  
  getPosisiTersedia: publicProcedure
    .query(() => getPosisiTersedia()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
