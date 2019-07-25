import fs from 'fs';

const cheerio = require('cheerio');
const request = require('request');

export class PetrobrasSource {
  
  private fetch(): Promise<any> {
    return new Promise((resolve, reject) => {
      request({
        method: 'GET',
        url: 'http://www.petrobras.com.br/pt/produtos-e-servicos/precos-de-venda-as-distribuidoras/gasolina-e-diesel/'
      }, (err, _res, body) => {
        
        if (err) {
          return reject(err);
        }
        return resolve(body);
      });
    });
  }
  
  private buildJson(body: any): any {
    const $ = cheerio.load(body);
    const table: string[] = [];
    
    $('td').each((_index, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      table.push(text);
    });

    function appendLeadingZeroes(n) {
      if (n <= 9) {
        return '0' + n;
      }
      return n;
    }
    
    const current_datetime = new Date();
    const formatted_date = current_datetime.getFullYear() + '-' + appendLeadingZeroes(current_datetime.getMonth() + 1) + '-' + appendLeadingZeroes(current_datetime.getDate());
    
    const local = { date: formatted_date };


    for (let i = 4; i < table.length; i += 4) {
      local[table[i]] = {
        gasolina: parseFloat(table[i + 1].replace(',', '.')),
        diesels500: parseFloat(table[i + 2].replace(',', '.')),
        diesels10: parseFloat(table[i + 3].replace(',', '.'))
      };
    }
  
    const precos = JSON.parse(JSON.stringify(local));
    return precos;

  }

  save(prices: any, filePath: string): void {
    fs.writeFileSync(filePath, JSON.stringify(prices, null, 2), 'utf-8');
  }
  
  async getPrices(): Promise<any> {
    const body = await this.fetch();
    const pricesJson = this.buildJson(body);
    return pricesJson;
  }
}
