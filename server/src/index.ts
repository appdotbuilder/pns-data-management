
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  loginInputSchema,
  createPegawaiInputSchema,
  updatePegawaiInputSchema,
  pegawaiFilterSchema,
  createRiwayatJabatanInputSchema,
  updateRiwayatJabatanInputSchema,
  createMutasiInputSchema,
  updateMutasiStatusInputSchema,
  mutasiFilterSchema,
  createPosisiTersediaInputSchema
} from './schema';

// Import handlers
import { login, getCurrentUser } from './handlers/auth';
import {
  createPegawai,
  getPegawaiList,
  getPegawaiById,
  updatePegawai,
  deletePegawai,
  getPegawaiMendekatiPensiun
} from './handlers/pegawai';
import {
  createRiwayatJabatan,
  getRiwayatJabatanByPegawai,
  updateRiwayatJabatan,
  deleteRiwayatJabatan,
  getCurrentJabatan
} from './handlers/riwayat_jabatan';
import {
  createMutasi,
  getMutasiList,
  updateMutasiStatus,
  getMutasiById,
  deleteMutasi
} from './handlers/mutasi';
import {
  createPosisiTersedia,
  getPosisiTersediaList,
  updatePosisiTersedia,
  deactivatePosisiTersedia
} from './handlers/posisi_tersedia';
import {
  getProvinsi,
  getKotaByProvinsi,
  getKecamatanByKota,
  getDesaByKecamatan
} from './handlers/wilayah';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),
  
  getCurrentUser: publicProcedure
    .input(z.number())
    .query(({ input }) => getCurrentUser(input)),

  // Pegawai routes
  createPegawai: publicProcedure
    .input(createPegawaiInputSchema)
    .mutation(({ input }) => createPegawai(input)),
  
  getPegawaiList: publicProcedure
    .input(pegawaiFilterSchema)
    .query(({ input }) => getPegawaiList(input)),
  
  getPegawaiById: publicProcedure
    .input(z.number())
    .query(({ input }) => getPegawaiById(input)),
  
  updatePegawai: publicProcedure
    .input(updatePegawaiInputSchema)
    .mutation(({ input }) => updatePegawai(input)),
  
  deletePegawai: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deletePegawai(input)),
  
  getPegawaiMendekatiPensiun: publicProcedure
    .query(() => getPegawaiMendekatiPensiun()),

  // Riwayat Jabatan routes
  createRiwayatJabatan: publicProcedure
    .input(createRiwayatJabatanInputSchema)
    .mutation(({ input }) => createRiwayatJabatan(input)),
  
  getRiwayatJabatanByPegawai: publicProcedure
    .input(z.number())
    .query(({ input }) => getRiwayatJabatanByPegawai(input)),
  
  updateRiwayatJabatan: publicProcedure
    .input(updateRiwayatJabatanInputSchema)
    .mutation(({ input }) => updateRiwayatJabatan(input)),
  
  deleteRiwayatJabatan: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteRiwayatJabatan(input)),
  
  getCurrentJabatan: publicProcedure
    .input(z.number())
    .query(({ input }) => getCurrentJabatan(input)),

  // Mutasi routes
  createMutasi: publicProcedure
    .input(createMutasiInputSchema)
    .mutation(({ input }) => createMutasi(input)),
  
  getMutasiList: publicProcedure
    .input(mutasiFilterSchema)
    .query(({ input }) => getMutasiList(input)),
  
  updateMutasiStatus: publicProcedure
    .input(updateMutasiStatusInputSchema)
    .mutation(({ input }) => updateMutasiStatus(input)),
  
  getMutasiById: publicProcedure
    .input(z.number())
    .query(({ input }) => getMutasiById(input)),
  
  deleteMutasi: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteMutasi(input)),

  // Posisi Tersedia routes
  createPosisiTersedia: publicProcedure
    .input(createPosisiTersediaInputSchema)
    .mutation(({ input }) => createPosisiTersedia(input)),
  
  getPosisiTersediaList: publicProcedure
    .query(() => getPosisiTersediaList()),
  
  updatePosisiTersedia: publicProcedure
    .input(z.object({
      id: z.number(),
      data: createPosisiTersediaInputSchema.partial()
    }))
    .mutation(({ input }) => updatePosisiTersedia(input.id, input.data)),
  
  deactivatePosisiTersedia: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deactivatePosisiTersedia(input)),

  // Wilayah routes (for address integration)
  getProvinsi: publicProcedure
    .query(() => getProvinsi()),
  
  getKotaByProvinsi: publicProcedure
    .input(z.string())
    .query(({ input }) => getKotaByProvinsi(input)),
  
  getKecamatanByKota: publicProcedure
    .input(z.string())
    .query(({ input }) => getKecamatanByKota(input)),
  
  getDesaByKecamatan: publicProcedure
    .input(z.string())
    .query(({ input }) => getDesaByKecamatan(input)),
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
