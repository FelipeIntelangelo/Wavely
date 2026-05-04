import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Category } from '../../models/enums/category.enum';

interface CategoryWithStyle {
  name: string;
  color: string;
  pattern: string;
}

@Component({
  selector: 'app-explore-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './explore-categories.html',
  styleUrls: ['./explore-categories.css']
})
export class ExploreCategories implements OnInit {
  categoriesWithColors: CategoryWithStyle[] = [];
  
  private colors = [
    '#667eea',
    '#f5576c',
    '#00f2fe',
    '#43e97b',
    '#fa709a',
    '#764ba2',
    '#fed6e3',
    '#ff9a9e',
    '#fcb69f',
    '#ff6e7f',
    '#8ec5fc',
    '#fe5196',
    '#fa71cd',
    '#a6c1ee',
    '#e6dee9',
  ];

  private patterns = [
    'pattern-4',
    'pattern-5',
    'pattern-6'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const categories = Object.values(Category) as string[];
    this.categoriesWithColors = categories.map((cat, index) => ({
      name: cat,
      color: this.colors[index % this.colors.length],
      pattern: this.patterns[index % this.patterns.length]
    }));
  }

  goToCategory(cat: string): void {
    this.router.navigate(['/explore', cat]);
  }
}
