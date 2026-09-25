import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CaseStudyComponent } from './case-study.component';
import { PROJECTS, findProject, nextProject } from '../../core/data/projects.data';
import { routes } from '../../app.routes';

/** Reads a protected member for assertions — the public API is the template. */
function memberOf(component: CaseStudyComponent, name: string): any {
  return (component as unknown as Record<string, any>)[name];
}

/** Mounts the case study for a given route slug. */
function mount(slug: string): ComponentFixture<CaseStudyComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [CaseStudyComponent],
    providers: [
      provideRouter(routes),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of({ get: (key: string) => (key === 'slug' ? slug : null) }),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(CaseStudyComponent);
  fixture.detectChanges();
  return fixture;
}

describe('CaseStudyComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('resolves the project from the route slug', () => {
    const fixture = mount('orbital');
    expect(memberOf(fixture.componentInstance, 'project')()?.title).toBe('Orbital');
  });

  it('resolves every project slug to its own case study', () => {
    for (const project of PROJECTS) {
      const fixture = mount(project.slug);
      expect(memberOf(fixture.componentInstance, 'project')()?.slug).toBe(project.slug);
      expect(memberOf(fixture.componentInstance, 'project')()?.title).toBe(project.title);
    }
  });

  it('renders nothing but the shell for an unknown slug', () => {
    const fixture = mount('nope');
    expect(memberOf(fixture.componentInstance, 'project')()).toBeUndefined();
    expect(fixture.nativeElement.querySelector('article')).toBeNull();
  });

  it('points the next-project link at the following project', () => {
    const fixture = mount('orbital');
    const next = memberOf(fixture.componentInstance, 'next')();

    expect(next?.slug).toBe('forge');
    expect(next?.slug).toBe(nextProject('orbital').slug);
  });

  it('wraps the next-project link at the end of the reading order', () => {
    const last = PROJECTS[PROJECTS.length - 1].slug;
    const fixture = mount(last);
    expect(memberOf(fixture.componentInstance, 'next')()?.slug).toBe(PROJECTS[0].slug);
  });

  it('has no next-project link when the project is unknown', () => {
    const fixture = mount('nope');
    expect(memberOf(fixture.componentInstance, 'next')()).toBeUndefined();
  });

  it('renders the next-project navigation as a real link', () => {
    const fixture = mount('orbital');
    const link = fixture.nativeElement.querySelector('.case__next-link') as HTMLAnchorElement | null;

    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/work/forge');
    expect(link?.textContent).toContain('Forge');
  });

  it('exposes a sticky index of all twelve sections', () => {
    const fixture = mount('orbital');
    const rail = fixture.nativeElement.querySelector('.case__rail') as HTMLElement;
    const links = [...rail.querySelectorAll('.case__rail-link')];

    expect(memberOf(fixture.componentInstance, 'sections')).toHaveLength(12);
    expect(links).toHaveLength(12);
    expect(links[0].getAttribute('href')).toBe('#overview');
    expect(links[11].getAttribute('href')).toBe('#improve-next');
  });

  it('marks the first section as current before any scrolling', () => {
    const fixture = mount('orbital');
    const current = fixture.nativeElement.querySelectorAll('.case__rail-link--current');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toContain('Overview');
  });

  it('renders every section heading in order', () => {
    const fixture = mount('orbital');
    const titles = [...fixture.nativeElement.querySelectorAll('.case__section-title')].map(
      (el) => el.textContent?.trim(),
    );
    expect(titles).toEqual(memberOf(fixture.componentInstance, 'sections').map((s: {label: string}) => s.label));
  });

  it('gives each section an id that the rail can target', () => {
    const fixture = mount('orbital');
    const ids = [...fixture.nativeElement.querySelectorAll('.case__section')].map((el) => el.id);
    expect(ids).toEqual(memberOf(fixture.componentInstance, 'sections').map((s: {id: string}) => s.id));
  });

  it('renders the masthead facts from the project data', () => {
    const fixture = mount('forge');
    const study = findProject('forge')!;
    const keys = [...fixture.nativeElement.querySelectorAll('.case__facts .meta__key')].map((el) =>
      el.textContent?.trim(),
    );
    expect(keys).toEqual(['Year', 'Role', 'Focus', 'Technology']);
    expect(fixture.nativeElement.textContent).toContain(study.year);
    expect(fixture.nativeElement.textContent).toContain(study.role);
  });

  it('labels each case study so its layout variant can be targeted', () => {
    for (const slug of ['orbital', 'forge', 'signal']) {
      const article = mount(slug).nativeElement.querySelector('article.case') as HTMLElement;
      expect(article.getAttribute('data-project')).toBe(slug);
    }
  });
});
