# Link 5 Pending Kosong + 24 Dummy — Produksi

> Buka di browser. Untuk **staging** pakai basic auth `181ff4f6c436d9a69f9dd12e` / `1a20e619d2d431d66ac60b17` saat diminta (atau buka via `http://76.13.198.18:8080`).

## 5 Pending Kosong (0 laporan, 0 foto) — `pending` tapi kosong, aman dihapus

| No | Nama | ID | Produksi Publik | Produksi Admin | Staging Publik |
|---|---|---|---|---|---|
| 1 | Cipanas | `7a1a27bc-a931-4bb1-ae28-8955e3dad7fa` | [prod publik](https://www.springhub.id/springs/7a1a27bc-a931-4bb1-ae28-8955e3dad7fa) | [admin](https://www.springhub.id/admin) → filter `pending` cari `Cipanas` | [staging](http://76.13.198.18:8080/springs/7a1a27bc-a931-4bb1-ae28-8955e3dad7fa) |
| 2 | Mata Air Ciburial | `8805a729-41a0-4476-b93d-f881fa0d46e5` | [prod publik](https://www.springhub.id/springs/8805a729-41a0-4476-b93d-f881fa0d46e5) | [admin](https://www.springhub.id/admin) | [staging](http://76.13.198.18:8080/springs/8805a729-41a0-4476-b93d-f881fa0d46e5) |
| 3 | Sumber Umbul | `be5cb7ef-ed5b-47b8-acfc-91fd93c0395a` | [prod publik](https://www.springhub.id/springs/be5cb7ef-ed5b-47b8-acfc-91fd93c0395a) | [admin](https://www.springhub.id/admin) | [staging](http://76.13.198.18:8080/springs/be5cb7ef-ed5b-47b8-acfc-91fd93c0395a) |
| 4 | Tirta Empul | `dbfe39d4-a2a9-469f-ace0-723094fb83b5` | [prod publik](https://www.springhub.id/springs/dbfe39d4-a2a9-469f-ace0-723094fb83b5) | [admin](https://www.springhub.id/admin) | [staging](http://76.13.198.18:8080/springs/dbfe39d4-a2a9-469f-ace0-723094fb83b5) |
| 5 | Tirta Gangga | `bfd009f1-3289-4782-b001-d425cfb6fd3d` | [prod publik](https://www.springhub.id/springs/bfd009f1-3289-4782-b001-d425cfb6fd3d) | [admin](https://www.springhub.id/admin) | [staging](http://76.13.198.18:8080/springs/bfd009f1-3289-4782-b001-d425cfb6fd3d) |

> Catatan: `GET /api/springs` hanya `active`, jadi 5 ini **tidak muncul** di publik (karena `pending`). Di admin `GET /api/admin/springs?status=pending` baru terlihat. Publik link di atas akan `404 Spring not found` — itu benar (pending tidak publik).

## 24 Dummy Pending (nama test) — `pending`, 0–4 laporan, foto 0–5

| No | Nama | ID | Produksi Publik | Staging Publik |
|---|---|---|---|---|
| 1 | Cek test | `6b398f0b-d5f4-4819-afb4-a705339d313f` | [prod](https://www.springhub.id/springs/6b398f0b-d5f4-4819-afb4-a705339d313f) | [staging](http://76.13.198.18:8080/springs/6b398f0b-d5f4-4819-afb4-a705339d313f) |
| 2 | Manga cokel | `84065af0-a0dc-4c12-b704-c8e6be3650d2` | [prod](https://www.springhub.id/springs/84065af0-a0dc-4c12-b704-c8e6be3650d2) | [staging](http://76.13.198.18:8080/springs/84065af0-a0dc-4c12-b704-c8e6be3650d2) |
| 3 | Mata Air | `0b156ec4-bfd2-43e4-82ef-8c47c7d7841b` | [prod](https://www.springhub.id/springs/0b156ec4-bfd2-43e4-82ef-8c47c7d7841b) | [staging](http://76.13.198.18:8080/springs/0b156ec4-bfd2-43e4-82ef-8c47c7d7841b) |
| 4 | Monggo | `c8a5be2d-ef59-4899-ba64-06c8e62039f2` | [prod](https://www.springhub.id/springs/c8a5be2d-ef59-4899-ba64-06c8e62039f2) | [staging](http://76.13.198.18:8080/springs/c8a5be2d-ef59-4899-ba64-06c8e62039f2) |
| 5 | Monggo | `aad2ac14-9df6-41bc-9f99-c67c7ed94247` | [prod](https://www.springhub.id/springs/aad2ac14-9df6-41bc-9f99-c67c7ed94247) | [staging](http://76.13.198.18:8080/springs/aad2ac14-9df6-41bc-9f99-c67c7ed94247) |
| 6 | Monggo Cokelat | `865b58e4-5b1d-40d5-a4ba-f65e13b36d55` | [prod](https://www.springhub.id/springs/865b58e4-5b1d-40d5-a4ba-f65e13b36d55) | [staging](http://76.13.198.18:8080/springs/865b58e4-5b1d-40d5-a4ba-f65e13b36d55) |
| 7 | Monggo Cokelat | `0c1b2b2f-574a-4eb1-bd69-21f4df13da96` | [prod](https://www.springhub.id/springs/0c1b2b2f-574a-4eb1-bd69-21f4df13da96) | [staging](http://76.13.198.18:8080/springs/0c1b2b2f-574a-4eb1-bd69-21f4df13da96) |
| 8 | Monggo Cokelat | `0c6ab375-c6d6-4604-a69c-2f56bc1e16de` | [prod](https://www.springhub.id/springs/0c6ab375-c6d6-4604-a69c-2f56bc1e16de) | [staging](http://76.13.198.18:8080/springs/0c6ab375-c6d6-4604-a69c-2f56bc1e16de) |
| 9 | Monggo Cokelat Volcanic Salt | `1529d41e-8929-4b7f-97ac-702774d00ad0` | [prod](https://www.springhub.id/springs/1529d41e-8929-4b7f-97ac-702774d00ad0) | [staging](http://76.13.198.18:8080/springs/1529d41e-8929-4b7f-97ac-702774d00ad0) |
| 10 | Monggo Cokelat Volcanic Salt 212 | `2fe58ad6-6392-4bd8-a07b-433d67fabe5c` | [prod](https://www.springhub.id/springs/2fe58ad6-6392-4bd8-a07b-433d67fabe5c) | [staging](http://76.13.198.18:8080/springs/2fe58ad6-6392-4bd8-a07b-433d67fabe5c) |
| 11 | Monggo Cokelat Volcanic Salt3123 | `e155abf9-ce00-4da9-ba2e-691fb9b0f9e4` | [prod](https://www.springhub.id/springs/e155abf9-ce00-4da9-ba2e-691fb9b0f9e4) | [staging](http://76.13.198.18:8080/springs/e155abf9-ce00-4da9-ba2e-691fb9b0f9e4) |
| 12 | Monggo Cokelat Volcanic Salt3123123 | `39f9c5a9-822c-4358-91ef-85d1fdefd2ae` | [prod](https://www.springhub.id/springs/39f9c5a9-822c-4358-91ef-85d1fdefd2ae) | [staging](http://76.13.198.18:8080/springs/39f9c5a9-822c-4358-91ef-85d1fdefd2ae) |
| 13 | Monggo Cokelat123 | `d0e94a4e-f6fc-4295-95b6-53ced9b15cf2` | [prod](https://www.springhub.id/springs/d0e94a4e-f6fc-4295-95b6-53ced9b15cf2) | [staging](http://76.13.198.18:8080/springs/d0e94a4e-f6fc-4295-95b6-53ced9b15cf2) |
| 14 | Test Spring Prod Verify 1787622555181 | `165b8e17-efd8-4784-b2db-e80dd245f2aa` | [prod](https://www.springhub.id/springs/165b8e17-efd8-4784-b2db-e80dd245f2aa) | [staging](http://76.13.198.18:8080/springs/165b8e17-efd8-4784-b2db-e80dd245f2aa) |
| 15 | Tester | `deba22cb-0a4b-4979-9c30-23067be4e9db` | [prod](https://www.springhub.id/springs/deba22cb-0a4b-4979-9c30-23067be4e9db) | [staging](http://76.13.198.18:8080/springs/deba22cb-0a4b-4979-9c30-23067be4e9db) |
| 16 | Tester | `a7278b17-cbef-4210-9453-7f48c623139a` | [prod](https://www.springhub.id/springs/a7278b17-cbef-4210-9453-7f48c623139a) | [staging](http://76.13.198.18:8080/springs/a7278b17-cbef-4210-9453-7f48c623139a) |
| 17 | Tester123 | `278e6f8f-ff37-45e3-9bae-e16d331bc77a` | [prod](https://www.springhub.id/springs/278e6f8f-ff37-45e3-9bae-e16d331bc77a) | [staging](http://76.13.198.18:8080/springs/278e6f8f-ff37-45e3-9bae-e16d331bc77a) |
| 18 | Tester1231 | `0f96eb74-8298-4af7-8f7a-ee63dde55f50` | [prod](https://www.springhub.id/springs/0f96eb74-8298-4af7-8f7a-ee63dde55f50) | [staging](http://76.13.198.18:8080/springs/0f96eb74-8298-4af7-8f7a-ee63dde55f50) |
| 19 | The Logat | `2b0a3ded-e129-4c91-9845-b3d0d5477525` | [prod](https://www.springhub.id/springs/2b0a3ded-e129-4c91-9845-b3d0d5477525) | [staging](http://76.13.198.18:8080/springs/2b0a3ded-e129-4c91-9845-b3d0d5477525) |
| 20 | The Logat123 | `45a72588-5cff-4431-84ed-da9c10d6df0d` | [prod](https://www.springhub.id/springs/45a72588-5cff-4431-84ed-da9c10d6df0d) | [staging](http://76.13.198.18:8080/springs/45a72588-5cff-4431-84ed-da9c10d6df0d) |
| 21 | The Logat123 | `79d70aac-76e0-49d9-bb1a-fb1650439a68` | [prod](https://www.springhub.id/springs/79d70aac-76e0-49d9-bb1a-fb1650439a68) | [staging](http://76.13.198.18:8080/springs/79d70aac-76e0-49d9-bb1a-fb1650439a68) |
| 22 | The Logat12312342 | `a6ea30a8-e7be-4b99-9962-efde7174a5ad` | [prod](https://www.springhub.id/springs/a6ea30a8-e7be-4b99-9962-efde7174a5ad) | [staging](http://76.13.198.18:8080/springs/a6ea30a8-e7be-4b99-9962-efde7174a5ad) |
| 23 | hage | `6e8d446f-6b05-4bc5-9c30-3d43b12c08c8` | [prod](https://www.springhub.id/springs/6e8d446f-6b05-4bc5-9c30-3d43b12c08c8) | [staging](http://76.13.198.18:8080/springs/6e8d446f-6b05-4bc5-9c30-3d43b12c08c8) |
| 24 | radio | `0c4f5833-175e-49e2-b8b9-52bd6dd5ea6d` | [prod](https://www.springhub.id/springs/0c4f5833-175e-49e2-b8b9-52bd6dd5ea6d) | [staging](http://76.13.198.18:8080/springs/0c4f5833-175e-49e2-b8b9-52bd6dd5ea6d) |

> **Cara cek cepat (tanpa login admin):** `curl -s https://www.springhub.id/api/springs/ID` → `{"error":"Spring not found"}` = benar pending tidak bocor.  
> **Cara cek admin:** `https://www.springhub.id/admin` → login `admin@springhub.id` / `demo12345` → tab **Map** → filter `pending` → cari nama di atas.

