"use client";

import ApplicationsSearch from "../../../components/Application/Search/Search";
import ApplicationsList from "../../../components/Application/List/List";
import ApplicationsAdd from "../../../components/Application/Add/Add";
import { useState } from "react";

export default function ApplicationsPage() {
  const [refresh, setRefresh] = useState(0);

  return (
    <main>
      <ApplicationsAdd onAdded={() => setRefresh((r) => r + 1)} />
      <br />
      <ApplicationsSearch onSubscribedChange={() => setRefresh((r) => r + 1)} />
      <br />
      <ApplicationsList key={refresh} />
    </main>
  );
}
