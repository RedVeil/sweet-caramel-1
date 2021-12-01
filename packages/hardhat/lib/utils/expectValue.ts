import { expect } from "chai";
import { Contract, ContractTransaction } from "ethers";

export async function expectRevert(
  call: any,
  revertReason: string
): Promise<Chai.AsyncAssertion> {
  return expect(call).to.be.revertedWith(revertReason);
}

export async function expectEvent(
  call: ContractTransaction,
  contract: Contract,
  event: string,
  params: any[]
): Promise<Chai.AsyncAssertion> {
  return expect(call)
    .to.emit(contract, event)
    .withArgs(...params);
}

export async function expectNoEvent(
  call: ContractTransaction,
  contract: Contract,
  event: string
): Promise<Chai.AsyncAssertion> {
  return expect(call).to.not.emit(contract, event);
}

export async function expectValue(
  value: any,
  expectedValue: any
): Promise<Chai.AsyncAssertion> {
  expect(value).to.equal(expectedValue);
}

export async function expectDeepValue(
  value: any[],
  expectedValue: any[]
): Promise<Chai.AsyncAssertion> {
  expect(value).to.deep.equal(expectedValue);
}
