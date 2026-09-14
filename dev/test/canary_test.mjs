import assert from "node:assert/strict"
import sinon from 'sinon';
import { expect } from 'chai';


describe('mocha canary test', () => {
    it("Mocha and Node.js test environment is operational",() => {
        assert.strictEqual(true,true)
    });

    it("handles asynchronous assertions properly", async () => {
        const result = await Promise.resolve("ready");
        assert.strictEqual(result, "ready");
    });

    it("runs on a supported Node.js runtime", () => {
        const majorVersion = parseInt(process.versions.node.split(".")[0], 10);
        assert.ok(majorVersion >= 20, `Expected Node.js >= 20, but running on v${process.version}`);
    });

    it("can use sinon for mocking and spying", () => {
        const myObject = {
            myMethod: () => "original"
        };
        const spy = sinon.spy(myObject, 'myMethod');
        myObject.myMethod();
        expect(spy.calledOnce).to.be.true;
        expect(spy.returned("original")).to.be.true;
    });

    it("can use chai for assertions", () => {
        const value = 42;
        expect(value).to.be.a('number');
        expect(value).to.equal(42);
    });
})