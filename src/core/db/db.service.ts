import {Injectable, Logger} from '@nestjs/common';
import {access, readFile, writeFile} from 'fs/promises';

@Injectable()
export class DbService {
    private readonly logger = new Logger(DbService.name);

    private dbFileName = 'db.json';

    constructor() {
        access(this.dbFileName).catch(
            () => writeFile(this.dbFileName, JSON.stringify({}))
        )
    }


    public async read(key: string): Promise<any> {
        return JSON.parse((await readFile(this.dbFileName)).toString())[key];
    }

    public async write(key: string, value: any) {
        const json = JSON.parse((await readFile(this.dbFileName)).toString());
        const file = JSON.stringify(Object.assign(json, {[key]: value}));
        return writeFile(this.dbFileName, file);
    }
}
