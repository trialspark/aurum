declare module "*.ne" {
  import { CompiledRules } from "nearley";

  const value: CompiledRules;
  export = value;
}
