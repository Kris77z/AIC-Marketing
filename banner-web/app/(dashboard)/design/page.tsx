import { redirect } from "next/navigation";

export default function DesignPage() {
  redirect("/generate?workflow=design");
}
