


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."categories" AS ENUM (
    'légumes',
    'fruits',
    'féculents',
    'conserves',
    'hygiène',
    'autre'
);


ALTER TYPE "public"."categories" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- On supprime la rangée s'il n'y avait qu'un item
  delete from "cart"
  where user_id = user_id_input
    and product_id = product_id_input
    and number = 1;

  -- On décrémente si le nombre d'items est > 1
  update "cart"
  set number = number - 1
  where user_id = user_id_input
    and product_id = product_id_input
    and number > 1;
end;
$$;


ALTER FUNCTION "public"."decrement_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_stock"("product_id_input" "uuid", "quantity_input" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update products
  set stock = stock - quantity_input
  where id = product_id_input
  and stock >= quantity_input;

  if not found then
    raise exception 'Stock insuffisant';
  end if;
end;
$$;


ALTER FUNCTION "public"."decrement_stock"("product_id_input" "uuid", "quantity_input" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disable_expired_rights"() RETURNS "void"
    LANGUAGE "sql"
    AS $$
  update public."User"
  set has_right = false
  where end_right < CURRENT_DATE
    and has_right = true;
$$;


ALTER FUNCTION "public"."disable_expired_rights"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_categories_enum"() RETURNS "text"[]
    LANGUAGE "sql"
    AS $$
  select enum_range(null::categories)::text[];
$$;


ALTER FUNCTION "public"."get_categories_enum"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- On ajoute une rangée si ce produit n'est pas encore dans le panier de l'utilisateur
  insert into "cart" (user_id, product_id, number)
  values (user_id_input, product_id_input, 1)

  -- On incrémente le nombre d'items correspondant sinon
  on conflict (user_id, product_id)
  do update set number = "cart".number + 1;
end;
$$;


ALTER FUNCTION "public"."increment_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prepare_notifications"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public."User"
  SET should_notify = true
  WHERE end_right = CURRENT_DATE + INTERVAL '7 days'
    AND notified = false;
END;
$$;


ALTER FUNCTION "public"."prepare_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_user_counters"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public."User"
  set
    current_weight = 0,
    current_price = 0,
    current_order = 0;
end;
$$;


ALTER FUNCTION "public"."reset_user_counters"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Admins" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."Admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Articles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "edited_at" timestamp without time zone DEFAULT "now"(),
    "title" "text",
    "content" "text",
    "image" "text",
    "file" "text"
);


ALTER TABLE "public"."Articles" OWNER TO "postgres";


ALTER TABLE "public"."Articles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."Articles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "pdf_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."Messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pdf_name" "text" NOT NULL
);


ALTER TABLE "public"."Requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gender" "text" NOT NULL,
    "firstName" "text" NOT NULL,
    "lastName" "text" NOT NULL,
    "birthday" "date",
    "phone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "address" "text" NOT NULL,
    "addAddress" "text",
    "city" "text" NOT NULL,
    "postalCode" "text" NOT NULL,
    "situation" "text",
    "quotient" "text",
    "wageType" "text",
    "otherWage" "text",
    "has_right" boolean NOT NULL,
    "end_right" "date" DEFAULT "now"() NOT NULL,
    "should_notify" boolean DEFAULT false NOT NULL,
    "notified" boolean DEFAULT false NOT NULL,
    "weight_limit" integer DEFAULT 0,
    "current_weight" integer DEFAULT 0 NOT NULL,
    "price_limit" real,
    "current_price" real DEFAULT '0'::real NOT NULL,
    "order_limit" smallint,
    "current_order" smallint DEFAULT '0'::smallint NOT NULL,
    "weight_min_limit" integer DEFAULT 4000,
    "start_right" "date" DEFAULT "now"(),
    "status" "text" DEFAULT 'Enregistré'::"text" NOT NULL
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "content" "jsonb" NOT NULL,
    "price" real NOT NULL,
    "delivered" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "orderReference" "text",
    "trackingUrl" "text",
    "dpdInterfaceData" "text",
    "dpdReady" boolean,
    "agency" "text",
    "contract" smallint
);


ALTER TABLE "public"."cart" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."constants" (
    "name" "text" NOT NULL,
    "value" real NOT NULL,
    "unit" "text"
);


ALTER TABLE "public"."constants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" real NOT NULL,
    "salePrice" real NOT NULL,
    "weight" real NOT NULL,
    "category" "text" NOT NULL,
    "image_name" "text",
    "stock" integer DEFAULT 0 NOT NULL,
    "description" "text",
    "productStockIncertainThreshold" smallint,
    "max_order" smallint DEFAULT '9'::smallint NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Admins"
    ADD CONSTRAINT "Admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Articles"
    ADD CONSTRAINT "Articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Messages"
    ADD CONSTRAINT "Messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Requests"
    ADD CONSTRAINT "Requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart"
    ADD CONSTRAINT "cart_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."constants"
    ADD CONSTRAINT "constants_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Messages"
    ADD CONSTRAINT "Messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Requests"
    ADD CONSTRAINT "Requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cart"
    ADD CONSTRAINT "cart_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE "public"."Admins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admins can delete messages" ON "public"."Messages" FOR DELETE USING (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins")));



CREATE POLICY "Admins can read all the messages" ON "public"."Messages" FOR SELECT USING (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins")));



CREATE POLICY "Admins can read all users" ON "public"."User" USING (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins"))) WITH CHECK (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins")));



CREATE POLICY "Admins can read and write" ON "public"."cart" USING (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins")));



CREATE POLICY "Admins can read and write" ON "public"."constants" USING (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins")));



CREATE POLICY "Admins can read and write" ON "public"."products" USING (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins"))) WITH CHECK (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins")));



ALTER TABLE "public"."Articles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Authentificated users can update" ON "public"."products" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Connected users can read" ON "public"."Admins" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."Messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."products" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."Articles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."constants" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."products" FOR SELECT USING (true);



ALTER TABLE "public"."Messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Public read access" ON "public"."products" FOR SELECT USING (true);



ALTER TABLE "public"."Requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Service role full access on User" ON "public"."User" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access on cart" ON "public"."cart" USING (true) WITH CHECK ((("client_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."User"
  WHERE (("User"."id" = "auth"."uid"()) AND ("User"."has_right" = true))))));



ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "User can insert its own cart" ON "public"."cart" FOR INSERT WITH CHECK (true);



CREATE POLICY "User can select their own cart" ON "public"."cart" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Users can access their own row" ON "public"."User" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "admins can delete requests" ON "public"."Requests" FOR DELETE USING (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins")));



CREATE POLICY "admins can read requests" ON "public"."Requests" FOR SELECT USING (("auth"."uid"() IN ( SELECT "Admins"."id"
   FROM "public"."Admins")));



CREATE POLICY "admins_are_gods" ON "public"."Articles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."Admins"
  WHERE ("Admins"."id" = "auth"."uid"()))));



ALTER TABLE "public"."cart" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."constants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can create a request" ON "public"."Requests" FOR INSERT WITH CHECK (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."decrement_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_stock"("product_id_input" "uuid", "quantity_input" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_stock"("product_id_input" "uuid", "quantity_input" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_stock"("product_id_input" "uuid", "quantity_input" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."disable_expired_rights"() TO "anon";
GRANT ALL ON FUNCTION "public"."disable_expired_rights"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."disable_expired_rights"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_categories_enum"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_categories_enum"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_categories_enum"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_cart_item"("user_id_input" "uuid", "product_id_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prepare_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."prepare_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prepare_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_user_counters"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_user_counters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_user_counters"() TO "service_role";
























GRANT ALL ON TABLE "public"."Admins" TO "anon";
GRANT ALL ON TABLE "public"."Admins" TO "authenticated";
GRANT ALL ON TABLE "public"."Admins" TO "service_role";



GRANT ALL ON TABLE "public"."Articles" TO "anon";
GRANT ALL ON TABLE "public"."Articles" TO "authenticated";
GRANT ALL ON TABLE "public"."Articles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Articles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Articles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Articles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Messages" TO "anon";
GRANT ALL ON TABLE "public"."Messages" TO "authenticated";
GRANT ALL ON TABLE "public"."Messages" TO "service_role";



GRANT ALL ON TABLE "public"."Requests" TO "anon";
GRANT ALL ON TABLE "public"."Requests" TO "authenticated";
GRANT ALL ON TABLE "public"."Requests" TO "service_role";



GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";



GRANT ALL ON TABLE "public"."cart" TO "anon";
GRANT ALL ON TABLE "public"."cart" TO "authenticated";
GRANT ALL ON TABLE "public"."cart" TO "service_role";



GRANT ALL ON TABLE "public"."constants" TO "anon";
GRANT ALL ON TABLE "public"."constants" TO "authenticated";
GRANT ALL ON TABLE "public"."constants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































