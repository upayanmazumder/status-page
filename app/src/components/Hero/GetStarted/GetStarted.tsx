'use client';

import React from 'react';
import Link from 'next/link';
import styles from './GetStarted.module.css';

const GetStarted = () => {
  return (
    <Link href="/profile" className={styles.btnShine}>
      Get early access
    </Link>
  );
};

export default GetStarted;
