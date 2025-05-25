"use client";

import React from "react";
import Link from "next/link";
import styles from "./GetStarted.module.css";

const GetStarted = () => {
  return (
    <Link href="/dashboard" passHref legacyBehavior>
      <a className={styles.btnShine}>Get early access</a>
    </Link>
  );
};

export default GetStarted;
