import unittest, sys, types, importlib.util, json, hashlib
from unittest.mock import patch
# Local lifecycle harness, not a substitute for GenVM or live multi-validator testing.
class Decorator:
    def __call__(self, f): return f
class TreeMap(dict):
    def __class_getitem__(cls, _): return cls
class Base:
    def __new__(cls):
        v=super().__new__(cls);v.records=TreeMap();return v
class Return:
    def __init__(self,v): self.calldata=v
G=types.SimpleNamespace(Contract=Base,public=types.SimpleNamespace(write=Decorator(),view=Decorator()),message=types.SimpleNamespace(sender_address='0xcreator'),vm=types.SimpleNamespace(Return=Return),nondet=types.SimpleNamespace(web=types.SimpleNamespace(get=None),exec_prompt=None))
sdk=types.ModuleType('genlayer');sdk.gl=G;sdk.TreeMap=TreeMap;sdk.u256=int;sys.modules['genlayer']=sdk
spec=importlib.util.spec_from_file_location('oracle','contracts/event_oracle.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
URL='https://api.github.com/repos/example/project/releases/tags/v2.0'
SRC=json.dumps([{'url':URL,'sha256':''}])
class Tests(unittest.TestCase):
    def setUp(self):
        self.clock=1000;self.p=patch.object(m,'now',lambda:self.clock);self.p.start();self.o=m.EventOracle()
        self.assessment={'outcome':'YES','conflict':False,'sources':[]}
        G.vm.run_nondet_unsafe=lambda a,b:self.assessment
    def tearDown(self): self.p.stop()
    def create(self): return self.o.create_event('Did release happen?', 'Release must be publicly published before cutoff.',1100,SRC,60)
    def test_immutable_final_and_boundary(self):
        i=self.create()
        with self.assertRaises(AssertionError): self.o.review(i)
        self.clock=1100;self.o.review(i)
        with self.assertRaises(AssertionError):self.o.get_resolution(i)
        with self.assertRaises(AssertionError):self.o.finalize(i)
        self.clock=1160;self.o.finalize(i);self.assertEqual(self.o.get_resolution(i),'YES')
        for f in [self.o.review,self.o.recover_timeout,self.o.finalize]:
            with self.assertRaises(AssertionError): f(i)
    def test_challenge_and_second_review(self):
        i=self.create();self.clock=1100;self.o.review(i)
        counter=json.dumps([{'url':URL+'/other','sha256':''}])
        self.o.challenge(i,'Published date contradicts the proposal.',counter)
        self.assertEqual(json.loads(self.o.get_event(i))['outcome'],'UNRESOLVED')
        with self.assertRaises(AssertionError):self.o.review(i)
        self.clock=1160;self.assessment={'outcome':'NO','conflict':False,'sources':[]};self.o.review(i)
        with self.assertRaises(AssertionError):self.o.challenge(i,'Another counter-evidence source.',counter)
        self.clock=1220;self.o.finalize(i);self.assertEqual(self.o.get_resolution(i),'NO')
    def test_timeout(self):
        i=self.create()
        with self.assertRaises(AssertionError):self.o.recover_timeout(i)
        self.clock=1100+1209600;self.o.recover_timeout(i);self.assertEqual(self.o.get_resolution(i),'UNRESOLVED')
    def test_invalid_sources(self):
        for url in ['http://api.github.com/repos/a/b','https://api.github.com.evil/repos/a/b','https://api.github.com@evil/repos/a/b','https://raw.githubusercontent.com/a/../b','https://api.github.com/repos/a/b?x=1']:
            with self.assertRaises(AssertionError):m.source_url(url)
        with self.assertRaises(AssertionError):m.evidence_specs(json.dumps([{'url':URL,'sha256':'bad'}]))
    def test_invalid_deadlines(self):
        for deadline in [999,1000,9999999999]:
            with self.assertRaises(AssertionError):self.o.create_event('Did release happen?','Precise complete resolution criteria.',deadline,SRC,60)
    def test_independent_fingerprint_comparison(self):
        a={'outcome':'YES','conflict':False,'sources':[{'url':URL,'status':'VALID','fingerprint':'abc','vote':'YES'}]}
        b=json.loads(json.dumps(a));self.assertTrue(m.same_decision(a,b));b['sources'][0]['fingerprint']='changed';self.assertFalse(m.same_decision(a,b))
    def test_unavailable_source_does_not_veto_good(self):
        G.nondet.web.get=lambda url: (_ for _ in ()).throw(Exception()) if url.endswith('bad') else types.SimpleNamespace(status=200,body=b'Released before cutoff.')
        G.nondet.exec_prompt=lambda *a,**kw:json.dumps({'vote':'YES','quote':'Released before cutoff.','reason':'Dated release evidence'})
        r=m.assess({'question':'Did release happen?','criteria':'Release before cutoff','deadline':1100},[{'url':URL,'sha256':''},{'url':URL+'/bad','sha256':''}]);self.assertEqual(r['outcome'],'YES');self.assertEqual(r['sources'][1]['status'],'INVALID')
    def test_hash_mismatch_unresolved(self):
        G.nondet.web.get=lambda url:types.SimpleNamespace(status=200,body=b'evidence')
        r=m.assess({'question':'Question?','criteria':'Criteria','deadline':1100},[{'url':URL,'sha256':'0'*64}]);self.assertEqual(r['outcome'],'UNRESOLVED')
    def test_conflicting_evidence(self):
        G.nondet.web.get=lambda url:types.SimpleNamespace(status=200,body=b'YES NO')
        replies=iter(['YES','NO']);G.nondet.exec_prompt=lambda *a,**kw:json.dumps({'vote':next(replies),'quote':'YES NO','reason':'Specific evidence'})
        r=m.assess({'question':'Question?','criteria':'Criteria','deadline':1100},[{'url':URL,'sha256':''},{'url':URL+'/other','sha256':''}]);self.assertEqual(r['outcome'],'UNRESOLVED');self.assertTrue(r['conflict'])
    def test_failed_consensus_leaves_retry_possible(self):
        i=self.create();self.clock=1100
        def fail(*a):raise RuntimeError('Consensus not reached')
        G.vm.run_nondet_unsafe=fail
        with self.assertRaises(RuntimeError):self.o.review(i)
        self.assertEqual(json.loads(self.o.get_event(i))['state'],'OPEN')

    def test_native_sdk_json_dictionary(self):
        G.nondet.web.get=lambda url:types.SimpleNamespace(status=200,body=b'Released on 2026-05-06.')
        G.nondet.exec_prompt=lambda *a,**kw:{'vote':'YES','quote':'Released on 2026-05-06.','reason':'Direct dated proof before cutoff'}
        r=m.assess({'question':'Question?','criteria':'Criteria','deadline':1792554248},[{'url':URL,'sha256':''}])
        self.assertEqual(r['outcome'],'YES')
        self.assertEqual(r['sources'][0]['status'],'VALID')

    def test_invalid_native_json_is_unresolved(self):
        G.nondet.web.get=lambda url:types.SimpleNamespace(status=200,body=b'Released on 2026-05-06.')
        G.nondet.exec_prompt=lambda *a,**kw:[]
        r=m.assess({'question':'Question?','criteria':'Criteria','deadline':1792554248},[{'url':URL,'sha256':''}])
        self.assertEqual(r['outcome'],'UNRESOLVED')
