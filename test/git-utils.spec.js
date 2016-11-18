/* global describe, it */
const expect = require('chai').expect;
const gitUtils = require('../src/git-utils');

describe('git-utils', () => {
    describe('parseRepoUrl', () => {
        it('https://', () => {
            const repoUrl = 'https://gitlab.example.com/jasonnutter/test-repo.git';

            const idHost = gitUtils.parseRepoUrl(repoUrl);

            expect(idHost.repoHost).to.equal('gitlab.example.com');
            expect(idHost.repoId).equal('jasonnutter/test-repo');
            expect(idHost.repoWebProtocol).equal('https');
        });

        it('http://', () => {
            const repoUrl = 'http://localhost/jasonnutter/test-repo.git';

            const idHost = gitUtils.parseRepoUrl(repoUrl);

            expect(idHost.repoHost).to.equal('localhost');
            expect(idHost.repoId).to.equal('jasonnutter/test-repo');
            expect(idHost.repoWebProtocol).equal('http');
        });

        it('git@', () => {
            const repoUrl = 'git@gitlab.com:jasonnutter/vscode-gitlab-mr-test.git';

            const idHost = gitUtils.parseRepoUrl(repoUrl);

            expect(idHost.repoHost).to.equal('gitlab.com');
            expect(idHost.repoId).to.equal('jasonnutter/vscode-gitlab-mr-test');
            expect(idHost.repoWebProtocol).equal('https');
        });

        it('ssh://', () => {
            const repoUrl = 'ssh://git@gitlab.example.com:22448/jasonnutter/test-repo.git';

            const idHost = gitUtils.parseRepoUrl(repoUrl);

            expect(idHost.repoHost).to.equal('gitlab.example.com');
            expect(idHost.repoId).to.equal('jasonnutter/test-repo');
            expect(idHost.repoWebProtocol).equal('https');
        });
    });
});
