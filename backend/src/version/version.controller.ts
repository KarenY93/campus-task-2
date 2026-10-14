import { Controller, Get } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Controller('version')
export class VersionController {
    @Get()
    getVersion(){
        const file = join(process.cwd(), 'version.json');
        if (!existsSync(file)) {
            return { version: 'dev', commit: 'local' };
        }
        return JSON.parse(readFileSync(file, 'utf-8'));
    }
}
