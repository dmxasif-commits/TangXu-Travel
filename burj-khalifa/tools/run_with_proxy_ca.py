"""Run a library script with certifi pointed at the session proxy's CA bundle (verification stays ON).
usage: python run_with_proxy_ca.py script.py args..."""
import sys, runpy, certifi
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
script = sys.argv[1]; sys.argv = sys.argv[1:]
runpy.run_path(script, run_name='__main__')
