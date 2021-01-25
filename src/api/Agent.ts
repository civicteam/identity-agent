import { DIDDocument } from 'did-resolver';
import { DID, DIDResolver } from '@/api/DID';
import { Subject, DefaultAgent, Verifier } from '@/api/internal';
import {
  AsymmetricKey,
  CryptoModule,
  JWT,
} from '@/service/crypto/CryptoModule';
import { JWE, JWTVerified } from 'did-jwt';
import { Task } from '@/service/task/Task';
import { AgentStorage } from '@/service/storage/AgentStorage';
import { TaskMaster } from '@/service/task/TaskMaster';
import nacl from 'tweetnacl';

export type Config = {
  // include this only while we keep an S3Cache DID resolver
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
};

export type Context = {
  didResolver: DIDResolver;
  crypto: CryptoModule;
  storage: AgentStorage;
  taskMaster: TaskMaster;
  config: Config;
};

export type Identity = {
  did: DID;
  signingKey: AsymmetricKey;
  encryptionKey: nacl.BoxKeyPair;
};

export abstract class Agent {
  abstract did: DID;
  abstract document: DIDDocument;
  abstract context: Context;

  abstract resolve(did: DID): Promise<DIDDocument>;

  abstract asSubject(): Subject;
  abstract asVerifier(): Verifier;

  abstract sign(payload?: Record<string, any>): Promise<JWT>;

  abstract verify(jwt: JWT): Promise<JWTVerified>;

  abstract encrypt(data: string, recipient: DID): Promise<JWE>;
  abstract decrypt(jwe: JWE): Promise<string>;

  abstract startSlowTask(delay?: number): Task<string>;

  abstract allResults(): Promise<any[]>;

  static for(did: DID, context?: Context) {
    return DefaultAgent.for(did, context);
  }

  static register(context?: Context) {
    return DefaultAgent.register(context);
  }
}