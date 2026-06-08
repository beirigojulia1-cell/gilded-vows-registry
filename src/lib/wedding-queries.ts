import { queryOptions } from "@tanstack/react-query";
import {
  listGifts,
  listPurchasedGiftIds,
  getSettings,
  listPurchases,
  checkIsAdmin,
} from "./wedding.functions";

export const giftsQuery = queryOptions({
  queryKey: ["gifts"],
  queryFn: () => listGifts(),
  staleTime: 30_000,
});

export const purchasedIdsQuery = queryOptions({
  queryKey: ["purchased-ids"],
  queryFn: () => listPurchasedGiftIds(),
  staleTime: 15_000,
});

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: () => getSettings(),
  staleTime: 60_000,
});

export const purchasesQuery = queryOptions({
  queryKey: ["purchases"],
  queryFn: () => listPurchases(),
});

export const isAdminQuery = queryOptions({
  queryKey: ["is-admin"],
  queryFn: () => checkIsAdmin(),
  staleTime: 60_000,
});
