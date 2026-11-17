import {inspectReleaseArtifact} from '../src/features/invitations/release-artifact.ts';
import {publicDemoMode} from '../src/features/invitations/public-policy.ts';
const report=inspectReleaseArtifact(process.cwd(),{artifacts:true,publicDemo:publicDemoMode(process.env)});
console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;
